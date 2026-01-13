import re


def validate_employee_no(employee_no):
    """验证员工编号格式"""
    if not employee_no:
        raise ValueError('员工编号不能为空')
    if len(employee_no) < 2 or len(employee_no) > 50:
        raise ValueError('员工编号长度应为2-50位')
    return employee_no


def validate_position_code(position_code):
    """验证岗位编码格式"""
    if not position_code:
        raise ValueError('岗位编码不能为空')
    if len(position_code) < 2 or len(position_code) > 50:
        raise ValueError('岗位编码长度应为2-50位')
    return position_code


def validate_phone(phone):
    """验证手机号格式"""
    if not phone:
        return None
    pattern = r'^1[3-9]\d{9}$'
    if not re.match(pattern, phone):
        raise ValueError('手机号格式不正确')
    return phone


def validate_email(email):
    """验证邮箱格式"""
    if not email:
        return None
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValueError('邮箱格式不正确')
    return email
