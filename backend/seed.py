import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, delete
from backend.app.models import Product, Base, User, Conversation, Message
from backend.app.database import DATABASE_URL
from backend.app.auth import get_password_hash

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

SELLERS = [
    {"email": "mia@sellers.test", "full_name": "Mia Lopez", "password": "Password123!"},
    {"email": "owen@sellers.test", "full_name": "Owen Patel", "password": "Password123!"},
    {"email": "lena@sellers.test", "full_name": "Lena Hart", "password": "Password123!"},
    {"email": "theo@sellers.test", "full_name": "Theo Bennett", "password": "Password123!"},
]


PRODUCTS = [
    {
        "name": "Vintage Leather Jacket",
        "description": "Soft, broken-in leather jacket with a classic biker cut. Minor scuffs for authentic vintage character.",
        "price": 180.0,
        "location": "San Francisco, CA",
        "image_urls": [
            "https://picsum.photos/seed/vintage-jacket/600/600",
            "https://picsum.photos/seed/vintage-jacket-2/600/600",
        ],
        "seller_email": SELLERS[0]["email"],
    },
    {
        "name": "Minimalist Desk Lamp",
        "description": "Matte black desk lamp with adjustable neck and warm LED bulb included.",
        "price": 45.0,
        "location": "Seattle, WA",
        "image_urls": ["https://picsum.photos/seed/desk-lamp/600/600"],
        "seller_email": SELLERS[1]["email"],
    },
    {
        "name": "Mid-Century Coffee Table",
        "description": "Walnut veneer coffee table with tapered legs. Light scratches on the surface.",
        "price": 220.0,
        "location": "Portland, OR",
        "image_urls": ["https://picsum.photos/seed/coffee-table/600/600"],
        "seller_email": SELLERS[0]["email"],
    },
    {
        "name": "Scandinavian Wool Throw",
        "description": "Hand-loomed wool blanket in muted earth tones. Perfect for layering on a sofa or bed.",
        "price": 95.0,
        "location": "Denver, CO",
        "image_urls": [
            "https://picsum.photos/seed/wool-throw/600/600",
            "https://picsum.photos/seed/wool-throw-2/600/600",
        ],
        "seller_email": SELLERS[2]["email"],
    },
    {
        "name": "Handmade Ceramic Planter Set",
        "description": "Set of three matte ceramic planters with drainage trays. Great for herbs or succulents.",
        "price": 60.0,
        "location": "Austin, TX",
        "image_urls": [
            "https://picsum.photos/seed/ceramic-planter/600/600",
        ],
        "seller_email": SELLERS[1]["email"],
    },
    {
        "name": "Compact Oak Bookshelf",
        "description": "Two-shelf solid oak bookcase with a natural oil finish. Fits perfectly in small apartments.",
        "price": 140.0,
        "location": "Chicago, IL",
        "image_urls": [
            "https://picsum.photos/seed/oak-bookshelf/600/600",
            "https://picsum.photos/seed/oak-bookshelf-2/600/600",
        ],
        "seller_email": SELLERS[3]["email"],
    },
    {
        "name": "Art Deco Wall Mirror",
        "description": "Gold-trimmed mirror with geometric border. Adds instant glam to entryways or bedrooms.",
        "price": 150.0,
        "location": "Brooklyn, NY",
        "image_urls": [
            "https://picsum.photos/seed/deco-mirror/600/600",
        ],
        "seller_email": SELLERS[2]["email"],
    },
]


async def get_or_create_user(session: AsyncSession, email: str, full_name: str, password: str) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user

    hashed = get_password_hash(password)
    user = User(email=email, full_name=full_name, password_hash=hashed, created_at=datetime.utcnow())
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def seed_products():
    async with AsyncSessionLocal() as session:
        seller_map = {}
        for seller in SELLERS:
            user = await get_or_create_user(session, seller["email"], seller["full_name"], seller["password"])
            seller_map[seller["email"]] = user

        await session.execute(delete(Message))
        await session.execute(delete(Conversation))
        await session.execute(delete(Product))
        await session.commit()

        for data in PRODUCTS:
            seller = seller_map[data["seller_email"]]
            product = Product(
                name=data["name"],
                description=data["description"],
                price=data["price"],
                location=data["location"],
                image_urls=data["image_urls"],
                seller_id=seller.id,
            )
            session.add(product)

        await session.commit()
        print(f"Successfully seeded {len(PRODUCTS)} marketplace listings!")

if __name__ == "__main__":
    asyncio.run(seed_products())
