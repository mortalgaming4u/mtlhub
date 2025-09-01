# app/scripts/init_db.py

from app.db.session import engine, Base
from app.models.novel import Novel
from app.models.chapter import Chapter

print("🔧 Creating tables in local SQLite DB...")
Base.metadata.create_all(bind=engine, checkfirst=True)
print("✅ Tables created successfully.")