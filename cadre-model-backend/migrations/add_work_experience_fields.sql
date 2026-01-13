-- ============================================
-- 干部动态信息表 - 添加工作经历字段
-- 执行日期: 2026-01-10
-- 说明: 在 cadre_dynamic_info 表中添加工作经历相关字段
-- ============================================

USE cadre_model;

-- 添加工作经历相关字段
ALTER TABLE cadre_dynamic_info
ADD COLUMN work_start_date DATE NULL COMMENT '工作开始日期' AFTER info_type,
ADD COLUMN work_end_date DATE NULL COMMENT '工作结束日期' AFTER work_start_date,
ADD COLUMN work_company VARCHAR(200) NULL COMMENT '工作单位' AFTER work_end_date,
ADD COLUMN work_position VARCHAR(100) NULL COMMENT '工作岗位' AFTER work_company;

-- 更新 info_type 字段注释，添加工作经历类型说明
ALTER TABLE cadre_dynamic_info
MODIFY COLUMN info_type INT NOT NULL COMMENT '信息类型：1-培训记录，2-项目经历，3-绩效数据，4-奖惩记录，5-职务变更，6-工作经历';

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
    AND COLUMN_NAME IN ('work_start_date', 'work_end_date', 'work_company', 'work_position', 'info_type')
ORDER BY
    ORDINAL_POSITION;

-- 回滚脚本（如需回滚，请执行以下语句）
-- ALTER TABLE cadre_dynamic_info DROP COLUMN work_start_date;
-- ALTER TABLE cadre_dynamic_info DROP COLUMN work_end_date;
-- ALTER TABLE cadre_dynamic_info DROP COLUMN work_company;
-- ALTER TABLE cadre_dynamic_info DROP COLUMN work_position;
-- ALTER TABLE cadre_dynamic_info MODIFY COLUMN info_type INT NOT NULL COMMENT '信息类型：1-培训记录，2-项目经历，3-绩效数据，4-奖惩记录，5-职务变更';
