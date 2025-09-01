# scripts/init_db.py

from app.db.session import engine, Base

# Import models so SQLAlchemy knows what to create
from app.models.novel import Novel
from app.models.chapter import Chapter

print("🔧 Creating tables in Render DB...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully.")