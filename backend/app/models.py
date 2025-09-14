from typing import Optional

from sqlalchemy import Column, Integer, PrimaryKeyConstraint, Text
from sqlmodel import Field, SQLModel

class Page(SQLModel, table=True):
    __tablename__ = 'Page'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='Page_pkey'),
    )

    id: Optional[int] = Field(default=None, sa_column=Column('id', Integer, primary_key=True))
    name: str = Field(sa_column=Column('name', Text))
