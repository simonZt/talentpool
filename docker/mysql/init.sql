import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
import pymysql
import bcrypt

def init_database():
    # 连接MySQL（不指定数据库）
    connection = pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        port=Config.MYSQL_PORT,
        charset='utf8mb4'
    )
    
    try:
        with connection.cursor() as cursor:
            # 创建数据库
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.MYSQL_DB} DEFAULT CHARACTER SET utf8mb4")
            cursor.execute(f"USE {Config.MYSQL_DB}")
            
            # 创建用户表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    real_name VARCHAR(100) NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'hr') DEFAULT 'hr',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 创建岗位表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS positions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    duration VARCHAR(100),
                    headcount INT,
                    salary_range VARCHAR(100),
                    age_requirement VARCHAR(50),
                    work_address VARCHAR(500),
                    education_requirement VARCHAR(100),
                    work_year_requirement VARCHAR(100),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users(id)
                )
            """)
            
            # 创建简历表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS resumes (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    candidate_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    email VARCHAR(100),
                    gender ENUM('male', 'female', 'other'),
                    age INT,
                    education VARCHAR(100),
                    work_years INT,
                    position_id INT,
                    hr_id INT,
                    resume_file_path VARCHAR(500),
                    status ENUM('pending', 'reviewing', 'interviewed', 'hired', 'rejected') DEFAULT 'pending',
                    parsed_info JSON,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_candidate (candidate_name, phone),
                    FOREIGN KEY (position_id) REFERENCES positions(id),
                    FOREIGN KEY (hr_id) REFERENCES users(id)
                )
            """)
            
            # 创建管理员账户
            hashed_password = bcrypt.hashpw("admin@2025".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                INSERT IGNORE INTO users (username, real_name, password, role) 
                VALUES (%s, %s, %s, 'admin')
            """, ('admin', '系统管理员', hashed_password))
            
            connection.commit()
            print("数据库初始化完成！")
            
    finally:
        connection.close()

if __name__ == '__main__':
    init_database()