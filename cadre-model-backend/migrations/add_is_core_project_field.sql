-- ============================================
-- 干部动态信息表 - 添加是否核心项目字段
-- 执行日期: 2026-01-10
-- 说明: 在 cadre_dynamic_info 表中添加 is_core_project 字段
-- ============================================

USE cadre_model;

-- 添加是否核心项目字段
ALTER TABLE cadre_dynamic_info
ADD COLUMN is_core_project BOOLEAN DEFAULT FALSE COMMENT '是否核心项目' AFTER project_rating;

-- 验证字段是否添加成功
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'cadre_model'
    AND TABLE_NAME = 'cadre_dynamic_info'
    AND COLUMN_NAME = 'is_core_project';

-- 回滚脚本（如需回滚，请执行以下语句）
-- ALTER TABLE cadre_dynamic_info DROP COLUMN is_core_project;
