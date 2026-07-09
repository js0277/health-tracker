-- ============================================
-- 轻食记 - 数据库初始化脚本
-- ============================================

CREATE DATABASE IF NOT EXISTS health_tracker
  DEFAULT CHARSET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE health_tracker;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  openid      VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
  nickname    VARCHAR(50) DEFAULT '新用户' COMMENT '昵称',
  avatar      VARCHAR(255) DEFAULT '' COMMENT '头像URL',
  gender      TINYINT DEFAULT 0 COMMENT '性别: 0未知 1男 2女',
  height      DECIMAL(5,1) DEFAULT NULL COMMENT '身高(cm)',
  weight      DECIMAL(5,1) DEFAULT NULL COMMENT '当前体重(kg)',
  target_kcal INT DEFAULT 2000 COMMENT '每日目标热量(千卡)',
  target_weight DECIMAL(5,1) DEFAULT NULL COMMENT '目标体重(kg)',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid)
) ENGINE=InnoDB COMMENT='用户表';

-- ============================================
-- 2. 食物库表
-- ============================================
CREATE TABLE IF NOT EXISTS foods (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL COMMENT '食物名称',
  category    VARCHAR(20) DEFAULT '' COMMENT '分类: staple/meat/vegetable/fruit/drink/snack',
  kcal        DECIMAL(6,1) NOT NULL COMMENT '热量(千卡/100g)',
  protein     DECIMAL(5,1) NOT NULL COMMENT '蛋白质(g/100g)',
  fat         DECIMAL(5,1) NOT NULL COMMENT '脂肪(g/100g)',
  carbs       DECIMAL(5,1) NOT NULL COMMENT '碳水(g/100g)',
  fiber       DECIMAL(5,1) DEFAULT 0 COMMENT '膳食纤维(g/100g)',
  sodium      DECIMAL(5,1) DEFAULT 0 COMMENT '钠(mg/100g)',
  unit        VARCHAR(10) DEFAULT '100g' COMMENT '单位',
  is_common   TINYINT DEFAULT 0 COMMENT '是否常用',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_is_common (is_common)
) ENGINE=InnoDB COMMENT='食物库表';

-- ============================================
-- 3. 饮食记录表
-- ============================================
CREATE TABLE IF NOT EXISTS diet_records (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL COMMENT '用户ID',
  meal_type   ENUM('breakfast','lunch','dinner','snack') NOT NULL COMMENT '餐次',
  record_date DATE NOT NULL COMMENT '日期',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, record_date)
) ENGINE=InnoDB COMMENT='饮食记录表';

-- ============================================
-- 4. 饮食记录明细表
-- ============================================
CREATE TABLE IF NOT EXISTS diet_record_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  record_id   INT NOT NULL COMMENT '记录ID',
  food_id     INT NOT NULL COMMENT '食物ID',
  food_name   VARCHAR(100) NOT NULL COMMENT '食物名称(冗余)',
  grams       DECIMAL(6,1) NOT NULL COMMENT '重量(g)',
  kcal        DECIMAL(6,1) NOT NULL COMMENT '热量(千卡/100g快照)',
  protein     DECIMAL(5,1) NOT NULL COMMENT '蛋白质(快照)',
  fat         DECIMAL(5,1) NOT NULL COMMENT '脂肪(快照)',
  carbs       DECIMAL(5,1) NOT NULL COMMENT '碳水(快照)',
  FOREIGN KEY (record_id) REFERENCES diet_records(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id)
) ENGINE=InnoDB COMMENT='饮食记录明细表';

-- ============================================
-- 5. 体重记录表
-- ============================================
CREATE TABLE IF NOT EXISTS weight_records (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL COMMENT '用户ID',
  weight      DECIMAL(5,1) NOT NULL COMMENT '体重(kg)',
  record_date DATE NOT NULL COMMENT '日期',
  record_time TIME DEFAULT '08:00' COMMENT '时间',
  note        VARCHAR(200) DEFAULT '' COMMENT '备注',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_user_date (user_id, record_date)
) ENGINE=InnoDB COMMENT='体重记录表';

-- ============================================
-- 初始数据：常见食物
-- ============================================
INSERT INTO foods (name, category, kcal, protein, fat, carbs, is_common) VALUES
('米饭(熟)', 'staple', 116, 2.6, 0.3, 25.6, 1),
('馒头', 'staple', 223, 7.0, 1.1, 44.2, 1),
('全麦面包', 'staple', 246, 8.5, 3.4, 43.6, 1),
('面条(煮)', 'staple', 110, 3.2, 0.3, 22.3, 1),
('煮鸡蛋', 'meat', 144, 13.3, 8.8, 2.8, 1),
('鸡胸肉', 'meat', 133, 31.0, 1.2, 0, 1),
('牛排', 'meat', 131, 22.3, 4.5, 0.6, 1),
('三文鱼', 'meat', 139, 17.2, 7.8, 0, 1),
('猪瘦肉', 'meat', 143, 20.3, 6.2, 1.5, 1),
('西兰花', 'vegetable', 34, 2.8, 0.4, 6.6, 1),
('豆腐', 'vegetable', 76, 8.1, 3.7, 2.8, 1),
('凉拌黄瓜', 'vegetable', 23, 1.2, 0.2, 4.2, 1),
('蒸南瓜', 'vegetable', 22, 0.7, 0.1, 4.6, 1),
('西红柿', 'vegetable', 18, 0.9, 0.2, 3.9, 1),
('菠菜', 'vegetable', 24, 2.6, 0.3, 4.5, 1),
('苹果', 'fruit', 53, 0.2, 0.2, 13.5, 1),
('香蕉', 'fruit', 93, 1.4, 0.2, 20.8, 1),
('橙子', 'fruit', 47, 0.8, 0.2, 11.1, 1),
('葡萄', 'fruit', 67, 0.7, 0.2, 16.0, 1),
('牛奶(全脂)', 'drink', 61, 3.0, 3.2, 4.8, 1),
('豆浆', 'drink', 33, 2.4, 1.3, 2.9, 1),
('酸奶', 'drink', 72, 2.5, 2.7, 9.3, 1),
('薯片', 'snack', 536, 6.3, 35.0, 53.0, 1),
('黑巧克力', 'snack', 546, 4.9, 31.3, 61.0, 1);
