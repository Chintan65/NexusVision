import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Database setup
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define User model
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to jobs
    jobs = relationship("InferenceJob", back_populates="owner")

# Define InferenceJob model
class InferenceJob(Base):
    __tablename__ = 'inference_jobs'
    id = Column(Integer, primary_key=True)
    job_id = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    model_name = Column(String, default='big-lama')
    status = Column(String) # PENDING, PROCESSING, COMPLETED, FAILED
    original_image_name = Column(String)
    # NEW FIELD: Store the original mask filename
    mask_image_name = Column(String)
    result_image_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship back to user
    owner = relationship("User", back_populates="jobs")

# Create tables
Base.metadata.create_all(bind=engine)