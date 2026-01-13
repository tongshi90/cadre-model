from flask import jsonify


def success_response(data=None, message='操作成功', code=200):
    """成功响应"""
    response = {
        'code': code,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), code


def error_response(message='操作失败', code=400, data=None):
    """错误响应"""
    response = {
        'code': code,
        'message': message
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), code


def paginate_response(items, total, page, page_size, message='查询成功'):
    """分页响应"""
    return success_response({
        'items': items,
        'total': total,
        'page': page,
        'page_size': page_size,
        'pages': (total + page_size - 1) // page_size
    }, message)


def build_pagination_query(query, page, page_size):
    """构建分页查询"""
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total
