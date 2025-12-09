import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import pymysql
import json
import os
from datetime import datetime
from werkzeug.utils import secure_filename
import pdfplumber
from docx import Document
import re

app = Flask(__name__)
app.config.from_object('config.Config')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads/resumes')
CORS(app)
jwt = JWTManager(app)

# 确保上传文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def get_db_connection():
    return pymysql.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        password=app.config['MYSQL_PASSWORD'],
        database=app.config['MYSQL_DB'],
        port=app.config['MYSQL_PORT'],
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )

# ==================== 工具函数 ====================
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def extract_text_from_pdf(filepath):
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except:
        pass
    return text

def extract_text_from_docx(filepath):
    text = ""
    try:
        doc = Document(filepath)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except:
        pass
    return text

def parse_resume_text(text):
    """简单的简历解析函数"""
    info = {
        'name': '',
        'phone': '',
        'email': '',
        'education': '',
        'work_experience': ''
    }
    
    # 提取手机号
    phone_pattern = r'1[3-9]\d{9}'
    phones = re.findall(phone_pattern, text)
    if phones:
        info['phone'] = phones[0]
    
    # 提取邮箱
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    if emails:
        info['email'] = emails[0]
    
    # 简单提取姓名（假设姓名在开头）
    lines = text.split('\n')
    for line in lines[:5]:
        if len(line.strip()) <= 10 and len(line.strip()) >= 2:
            info['name'] = line.strip()
            break
    
    return info

# ==================== 认证相关 ====================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': '请提供用户名和密码'}), 400
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM users WHERE username = %s"
            cursor.execute(sql, (username,))
            user = cursor.fetchone()
            
            if user and check_password(password, user['password']):
                access_token = create_access_token(
                    identity={
                        'id': user['id'],
                        'username': user['username'],
                        'role': user['role']
                    }
                )
                return jsonify({
                    'token': access_token,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'real_name': user['real_name'],
                        'role': user['role']
                    }
                })
            else:
                return jsonify({'error': '用户名或密码错误'}), 401
    finally:
        conn.close()

# ==================== 用户管理 ====================
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({'error': '权限不足'}), 403
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT id, username, real_name, role, created_at FROM users"
            cursor.execute(sql)
            users = cursor.fetchall()
            return jsonify(users)
    finally:
        conn.close()

@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify({'error': '权限不足'}), 403
    
    data = request.get_json()
    username = data.get('username')
    real_name = data.get('real_name')
    
    if not username or not real_name:
        return jsonify({'error': '请提供用户名和真实姓名'}), 400
    
    # 默认密码
    default_password = "admin@2025"
    hashed_password = hash_password(default_password)
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO users (username, real_name, password, role) 
                     VALUES (%s, %s, %s, 'hr')"""
            cursor.execute(sql, (username, real_name, hashed_password))
            user_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'id': user_id,
                'username': username,
                'real_name': real_name,
                'message': '用户创建成功，默认密码：admin@2025'
            })
    except pymysql.err.IntegrityError:
        return jsonify({'error': '用户名已存在'}), 400
    finally:
        conn.close()

# ==================== 岗位管理 ====================
@app.route('/api/positions', methods=['GET'])
@jwt_required()
def get_positions():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """SELECT p.*, u.real_name as created_by_name 
                     FROM positions p 
                     LEFT JOIN users u ON p.created_by = u.id 
                     WHERE p.is_active = TRUE 
                     ORDER BY p.created_at DESC"""
            cursor.execute(sql)
            positions = cursor.fetchall()
            return jsonify(positions)
    finally:
        conn.close()

@app.route('/api/positions', methods=['POST'])
@jwt_required()
def create_position():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['name', 'description', 'duration', 'headcount', 
                      'salary_range', 'work_address']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'请填写{field}'}), 400
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """INSERT INTO positions 
                     (name, description, duration, headcount, salary_range, 
                      age_requirement, work_address, education_requirement, 
                      work_year_requirement, created_by) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (
                data['name'],
                data['description'],
                data.get('duration'),
                data.get('headcount'),
                data.get('salary_range'),
                data.get('age_requirement'),
                data.get('work_address'),
                data.get('education_requirement'),
                data.get('work_year_requirement'),
                current_user['id']
            ))
            position_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'id': position_id,
                'message': '岗位创建成功'
            })
    finally:
        conn.close()

@app.route('/api/positions/<int:position_id>', methods=['PUT'])
@jwt_required()
def update_position(position_id):
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """UPDATE positions SET 
                     name=%s, description=%s, duration=%s, headcount=%s, 
                     salary_range=%s, age_requirement=%s, work_address=%s, 
                     education_requirement=%s, work_year_requirement=%s 
                     WHERE id=%s"""
            cursor.execute(sql, (
                data.get('name'),
                data.get('description'),
                data.get('duration'),
                data.get('headcount'),
                data.get('salary_range'),
                data.get('age_requirement'),
                data.get('work_address'),
                data.get('education_requirement'),
                data.get('work_year_requirement'),
                position_id
            ))
            conn.commit()
            return jsonify({'message': '岗位更新成功'})
    finally:
        conn.close()

# ==================== 简历管理 ====================
@app.route('/api/resumes', methods=['GET'])
@jwt_required()
def get_resumes():
    current_user = get_jwt_identity()
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if current_user['role'] == 'admin':
                sql = """SELECT r.*, p.name as position_name, u.real_name as hr_name 
                         FROM resumes r 
                         LEFT JOIN positions p ON r.position_id = p.id 
                         LEFT JOIN users u ON r.hr_id = u.id 
                         ORDER BY r.created_at DESC"""
                cursor.execute(sql)
            else:
                sql = """SELECT r.*, p.name as position_name, u.real_name as hr_name 
                         FROM resumes r 
                         LEFT JOIN positions p ON r.position_id = p.id 
                         LEFT JOIN users u ON r.hr_id = u.id 
                         WHERE r.hr_id = %s 
                         ORDER BY r.created_at DESC"""
                cursor.execute(sql, (current_user['id'],))
            
            resumes = cursor.fetchall()
            return jsonify(resumes)
    finally:
        conn.close()

@app.route('/api/resumes/check-duplicate', methods=['POST'])
@jwt_required()
def check_duplicate():
    data = request.get_json()
    candidate_name = data.get('candidate_name')
    phone = data.get('phone')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT id, candidate_name FROM resumes WHERE candidate_name = %s AND phone = %s"
            cursor.execute(sql, (candidate_name, phone))
            duplicate = cursor.fetchone()
            
            return jsonify({
                'is_duplicate': duplicate is not None,
                'existing_record': duplicate
            })
    finally:
        conn.close()

@app.route('/api/resumes/upload', methods=['POST'])
@jwt_required()
def upload_resume():
    current_user = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 解析简历
        if filename.endswith('.pdf'):
            text = extract_text_from_pdf(filepath)
        elif filename.endswith(('.doc', '.docx')):
            text = extract_text_from_docx(filepath)
        else:
            text = ""
        
        parsed_info = parse_resume_text(text)
        
        return jsonify({
            'filename': filename,
            'filepath': filepath,
            'parsed_info': parsed_info,
            'message': '文件上传成功'
        })
    
    return jsonify({'error': '文件类型不支持'}), 400

@app.route('/api/resumes', methods=['POST'])
@jwt_required()
def create_resume():
    current_user = get_jwt_identity()
    data = request.get_json()
    
    # 检查重复
    candidate_name = data.get('candidate_name')
    phone = data.get('phone')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查重复
            sql = "SELECT id FROM resumes WHERE candidate_name = %s AND phone = %s"
            cursor.execute(sql, (candidate_name, phone))
            if cursor.fetchone():
                return jsonify({'error': '该候选人已存在（姓名+手机号重复）'}), 400
            
            sql = """INSERT INTO resumes 
                     (candidate_name, phone, email, gender, age, education, 
                      work_years, position_id, hr_id, resume_file_path, 
                      parsed_info, notes, status) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (
                candidate_name,
                phone,
                data.get('email'),
                data.get('gender'),
                data.get('age'),
                data.get('education'),
                data.get('work_years'),
                data.get('position_id'),
                current_user['id'],
                data.get('resume_file_path'),
                json.dumps(data.get('parsed_info', {}), ensure_ascii=False),
                data.get('notes'),
                data.get('status', 'pending')
            ))
            resume_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'id': resume_id,
                'message': '简历创建成功'
            })
    finally:
        conn.close()

@app.route('/api/resumes/<int:resume_id>', methods=['PUT'])
@jwt_required()
def update_resume(resume_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 检查权限（HR只能编辑自己创建的简历）
            if current_user['role'] == 'hr':
                sql = "SELECT hr_id FROM resumes WHERE id = %s"
                cursor.execute(sql, (resume_id,))
                resume = cursor.fetchone()
                if not resume or resume['hr_id'] != current_user['id']:
                    return jsonify({'error': '权限不足'}), 403
            
            sql = """UPDATE resumes SET 
                     candidate_name=%s, phone=%s, email=%s, gender=%s, age=%s, 
                     education=%s, work_years=%s, position_id=%s, 
                     resume_file_path=%s, parsed_info=%s, notes=%s, status=%s 
                     WHERE id=%s"""
            cursor.execute(sql, (
                data.get('candidate_name'),
                data.get('phone'),
                data.get('email'),
                data.get('gender'),
                data.get('age'),
                data.get('education'),
                data.get('work_years'),
                data.get('position_id'),
                data.get('resume_file_path'),
                json.dumps(data.get('parsed_info', {}), ensure_ascii=False),
                data.get('notes'),
                data.get('status'),
                resume_id
            ))
            conn.commit()
            
            return jsonify({'message': '简历更新成功'})
    finally:
        conn.close()

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    current_user = get_jwt_identity()
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            stats = {}
            
            # 岗位数量
            cursor.execute("SELECT COUNT(*) as count FROM positions WHERE is_active = TRUE")
            stats['position_count'] = cursor.fetchone()['count']
            
            # 简历总数
            if current_user['role'] == 'admin':
                cursor.execute("SELECT COUNT(*) as count FROM resumes")
                stats['resume_count'] = cursor.fetchone()['count']
                
                # 按状态统计
                cursor.execute("""
                    SELECT status, COUNT(*) as count 
                    FROM resumes 
                    GROUP BY status
                """)
                stats['status_stats'] = cursor.fetchall()
            else:
                cursor.execute("SELECT COUNT(*) as count FROM resumes WHERE hr_id = %s", 
                             (current_user['id'],))
                stats['resume_count'] = cursor.fetchone()['count']
                
                cursor.execute("""
                    SELECT status, COUNT(*) as count 
                    FROM resumes 
                    WHERE hr_id = %s
                    GROUP BY status
                """, (current_user['id'],))
                stats['status_stats'] = cursor.fetchall()
            
            # 用户数量（仅管理员）
            if current_user['role'] == 'admin':
                cursor.execute("SELECT COUNT(*) as count FROM users")
                stats['user_count'] = cursor.fetchone()['count']
            
            return jsonify(stats)
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000,debug=False)