Inventory Management System

This project started as a way for me to get more experience building a full-stack application from scratch. I wanted something that covered more than basic CRUD, so I kept adding features that introduced new concepts as I learned them.

The application is built with FastAPI, SQLAlchemy, SQLite, React, and Vite. It allows users to manage inventory items, track stock changes over time, and view the history of inventory movements instead of only storing the current quantity.

Features

* Create, edit, and delete inventory items
* Search and sort inventory
* Low stock alerts
* Inventory summaries by category and supplier
* Stock movement history
* Transaction notes
* Supplier suggestions
* Pagination for inventory and transaction history

Tech Stack

Frontend

* React
* Vite

Backend

* FastAPI
* SQLAlchemy
* SQLite

Why I Added Transaction History:

One feature I wanted to explore was keeping a history of inventory changes rather than simply updating a quantity value.

Each inventory item stores its current quantity for fast reads, while every stock movement is recorded as its own transaction. This keeps the current inventory easy to query while also preserving an audit trail of how that quantity changed over time.

Transaction types include:

* Initial inventory
* Stock in
* Stock out
* Inventory adjustments

Transaction notes can be edited later, but the quantity history itself cannot, which helps preserve the integrity of the inventory history.

Running the Project

Backend

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend

cd frontend
npm install
npm run dev

Future Improvements

Some ideas I’d like to continue working on include:

* Better dashboard visualizations
* Backend unit tests
* Database migrations with Alembic
* Improved frontend styling
* Deployment