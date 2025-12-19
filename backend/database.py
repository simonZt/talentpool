# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./hr_system.db"  # 生产环境建议换为 PostgreSQL/MySQL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# utils/resume_parser.py
import re
import PyPDF2
import docx

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        return ""

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        return ""

def parse_resume_content(text: str):
    """
    基于正则的简历解析器
    """
    data = {
        "name": "",
        "phone": "",
        "education_info": {"school": "", "major": "", "degree": "", "grad_year": ""},
        "work_years": None
    }

    # 1. 提取姓名 (假设关键词在前面或包含"姓名")
    name_match = re.search(r"([\u4e00-\u9fa5]{2,4})\s*(先生|女士)?", text[:200]) # 仅看前200字
    if name_match:
        data["name"] = name_match.group(1)

    # 2. 提取手机号
    phone_match = re.search(r"(?:(?:\+|00)86)?1[3-9]\d{9}", text)
    if phone_match:
        data["phone"] = phone_match.group(0)

    # 3. 学历信息
    edu_pattern = re.compile(r"(?P<school>[\u4e00-\u9fa5]+大学?)\s*(?P<major>[\u4e00-\u9fa5]+)?\s*(?P<degree>博士|硕士|本科|大专)?\s*(?P<year>\d{4})?(年)?")
    edu_match = edu_pattern.search(text)
    if edu_match:
        data["education_info"].update(edu_match.groupdict())

    # 4. 工作年限
    year_match = re.search(r"(\d+)\+?\s*年工作", text)
    if year_match:
        data["work_years"] = int(year_match.group(1))
    else:
        # 尝试匹配 "工作X年"
        year_match = re.search(r"工作(\d+)年", text)
        if year_match:
            data["work_years"] = int(year_match.group(1))

    return data
