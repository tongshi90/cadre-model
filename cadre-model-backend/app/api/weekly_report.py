from flask import request, Response, stream_with_context
from app.api import weekly_report_bp
from app.utils.helpers import success_response, error_response
import json


@weekly_report_bp.route('/weekly-report/data', methods=['GET'])
def get_weekly_report_data():
    """获取周报数据用于AI分析"""
    from app.models.weekly_report import WeeklyReport
    from app import db

    try:
        # 获取所有周报数据
        reports = WeeklyReport.query.order_by(WeeklyReport.created_at.desc()).all()

        # 如果没有数据，返回空数据
        if not reports:
            return success_response([], '获取成功')

        # 转换为INSERT语句格式供AI使用
        insert_statements = []
        for report in reports:
            stmt = f"INSERT INTO weekly_report (content, created_at) VALUES ('{report.content.replace(chr(39), chr(39)+chr(39))}', '{report.created_at.strftime('%Y-%m-%d %H:%M:%S')}');"
            insert_statements.append(stmt)

        # 同时返回原始数据
        report_data = [report.to_dict() for report in reports]

        return success_response({
            'insert_statements': insert_statements,
            'reports': report_data
        }, '获取成功')

    except Exception as e:
        return error_response(f'获取失败: {str(e)}', 500)


def estimate_tokens(text: str) -> int:
    """
    估算文本的token数量
    中文：约1.5字符/token，英文：约4字符/token
    这里使用简化估算：中英文混合约2字符/token
    """
    return len(text) // 2


def check_token_limit(messages: list, model_name: str, model_max_tokens: int) -> dict:
    """
    检查消息是否超过模型的token限制

    Args:
        messages: 消息列表
        model_name: 模型名称
        model_max_tokens: 模型最大token数

    Returns:
        检查结果字典
    """
    # 计算所有消息的总token数
    total_tokens = 0
    breakdown = []

    for msg in messages:
        content = msg.get('content', '')
        msg_tokens = estimate_tokens(content)
        total_tokens += msg_tokens
        breakdown.append({
            'role': msg.get('role'),
            'tokens': msg_tokens,
            'content_length': len(content)
        })

    # 计算token使用率
    usage_rate = (total_tokens / model_max_tokens) * 100

    # 预留输出空间（约2048 tokens）
    reserved_output = 2048
    available_for_input = model_max_tokens - reserved_output

    return {
        'model': model_name,
        'model_max_tokens': model_max_tokens,
        'estimated_input_tokens': total_tokens,
        'usage_rate': f'{usage_rate:.2f}%',
        'will_truncate': total_tokens > available_for_input,
        'available_tokens': available_for_input,
        'breakdown': breakdown,
        'message': (
            f'⚠️ Token超限警告！当前估算{total_tokens} tokens，'
            f'超过安全阈值{available_for_input} tokens，可能被截断！'
            if total_tokens > available_for_input
            else f'✅ Token正常。当前{total_tokens} tokens，'
            f'使用率{usage_rate:.1f}%，安全阈值{available_for_input} tokens。'
        )
    }


@weekly_report_bp.route('/weekly-report/ai-chat', methods=['POST'])
def ai_chat():
    """AI对话接口（流式输出）"""
    from app.models.weekly_report import WeeklyReport
    from app import db

    try:
        data = request.get_json()
        user_message = data.get('message')
        conversation_history = data.get('history', [])

        if not user_message:
            return error_response('缺少消息内容', 400)

        # 获取周报数据
        reports = WeeklyReport.query.order_by(WeeklyReport.created_at.desc()).all()

        # 如果没有数据，返回提示（流式）
        if not reports:
            def generate_no_data():
                yield f"data: {json.dumps({'content': '暂无周报数据，请先添加周报数据。'}, ensure_ascii=False)}\n\n"
                yield "data: [DONE]\n\n"
            return Response(stream_with_context(generate_no_data()), mimetype='text/event-stream')

        # 构建上下文数据时添加元数据信息（提交人、时间）
        context_parts = []
        for i, report in enumerate(reports, 1):
            # 获取提交人信息（如果有的话）
            submitter = getattr(report, 'submitter', '')
            created_at = report.created_at.strftime('%Y-%m-%d') if report.created_at else ''
            meta_info = f"【周报{i}"
            if submitter:
                meta_info += f" | 提交人: {submitter}"
            if created_at:
                meta_info += f" | 时间: {created_at}"
            meta_info += "】\n"
            context_parts.append(f"{meta_info}{report.content}\n")

        context_data = "\n".join(context_parts)

        # 构建系统提示词
        system_prompt = """你现在需要扮演一个基于干部周报数据的智能问答助手，核心规则如下：

【数据来源特性】
你将获得若干条周报记录，每条记录包含提交人、提交时间和周报内容。

⚠️ 重要：周报具有时效性和连续性
- 同一事项可能在不同周报中多次出现，代表不同阶段的进展
- 例如：第一周"项目A完成20%"，第二周"项目A完成80%"，这是同一事项的进度更新，而非重复
- 回答问题时需要识别并合并这些连续的进度信息，展现完整的时间线

【回答要求】
1. 直接给出答案，不要说明从哪条周报获取的信息，不要展示分析过程
2. 可以回答的问题类型包括但不限于：
   - 某干部的项目进度、工作内容、风险点
   - 某项目的负责人、进展情况
   - 某时间段的工作安排
   - 各项工作的完成情况
   - 某事项的完整进展时间线

3. 智能处理连续信息：
   - 识别同一事项在不同周报中的进度更新
   - 按时间顺序合并信息，展现完整进展
   - 对于用户询问的事项，提供从开始到当前的完整时间线
   - 避免简单罗列重复信息，而是提炼出事项的发展脉络

4. 若用户问题涉及多个干部或多个项目，需分维度清晰罗列，逻辑连贯

5. 若问题在周报内容中无对应信息，直接回复"未查询到相关周报信息"

【格式规范】
- 回答简洁明了，直接呈现结果
- 优先使用条目化表述
- 涉及时间的内容，保持原文格式或转换为易读格式
- 展现事项进展时，建议使用时间线或进度条的方式呈现"""

        # 构建消息列表
        messages = [
            {
                "role": "system",
                "content": f"{system_prompt}\n\n【周报数据上下文】\n{context_data}"
            }
        ]

        # 添加对话历史（仅保留最近的5轮对话以控制token使用）
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        for msg in recent_history:
            if msg.get('role') in ['user', 'assistant']:
                messages.append({
                    "role": msg['role'],
                    "content": msg['content']
                })

        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": user_message
        })

        # Token检查（Qwen2.5-14B-Instruct 最大支持 32768 tokens）
        token_check = check_token_limit(messages, 'Qwen/Qwen2.5-14B-Instruct', 32768)

        # 流式生成器函数
        def generate_stream():
            import requests
            try:
                # 调用硅基流动API（流式）
                response = requests.post(
                    'https://api.siliconflow.cn/v1/chat/completions',
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer sk-pjdyzooethndmyauyzjbopafxxqogayzhjopheijtwgkgras',
                    },
                    json={
                        'model': 'Qwen/Qwen2.5-14B-Instruct',
                        'messages': messages,
                        'stream': True,
                    },
                    timeout=120,
                    stream=True
                )

                if response.status_code != 200:
                    error_msg = json.dumps({'content': f'AI服务请求失败: {response.status_code}'}, ensure_ascii=False)
                    yield f"data: {error_msg}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                # 处理流式响应
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        # SSE格式：data: {...}
                        if line.startswith('data: '):
                            data_str = line[6:]  # 去掉 'data: ' 前缀
                            if data_str.strip() == '[DONE]':
                                yield "data: [DONE]\n\n"
                                break
                            try:
                                data_json = json.loads(data_str)
                                # 提取内容
                                content = data_json.get('choices', [{}])[0].get('delta', {}).get('content', '')
                                if content:
                                    # 转发给前端
                                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
                            except json.JSONDecodeError:
                                continue

            except requests.exceptions.Timeout:
                error_msg = json.dumps({'content': '请求超时，请稍后重试'}, ensure_ascii=False)
                yield f"data: {error_msg}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                error_msg = json.dumps({'content': f'流式输出发生错误: {str(e)}'}, ensure_ascii=False)
                yield f"data: {error_msg}\n\n"
                yield "data: [DONE]\n\n"

        return Response(stream_with_context(generate_stream()), mimetype='text/event-stream')

    except Exception as e:
        return error_response(f'对话失败: {str(e)}', 500)
