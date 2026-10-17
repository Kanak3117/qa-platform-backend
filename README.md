# \# AI-Powered QA Test \& Bug Intelligence Platform: Backend

# 

# Backend for the QA Test \& Bug Intelligence Platform, built with FastAPI and PostgreSQL.

# 

# Currently implemented: authentication, users, projects and project members. Test management, bug tracking and AI analysis are being added by the team.

# 

# \## Tech stack

# 

# \- Python 3.10+ (developed on 3.14), FastAPI, Uvicorn

# \- PostgreSQL, SQLAlchemy 2, Alembic (migrations)

# \- JWT authentication (PyJWT), bcrypt password hashing

# 

# \## Setup

# 

# 1\. Clone the repo and enter the folder:

# 

# ```

# git clone https://github.com/Kanak3117/qa-platform-backend

# cd qa-platform-backend

# ```

# 

# 2\. Create and activate a virtual environment (Windows PowerShell):

# 

# ```

# python -m venv venv

# venv\\Scripts\\Activate.ps1

# ```

# 

# If scripts are blocked, run `Set-ExecutionPolicy -Scope Process Bypass` first.

# 

# 3\. Install dependencies:

# 

# ```

# pip install -r requirements.txt

# ```

# 

# 4\. Create an empty PostgreSQL database named `qa\_platform`:

# 

# ```

# CREATE DATABASE qa\_platform;

# ```

# 

# 5\. Copy `.env.example` to `.env` and fill in your own values (`.env` is not committed):

# 

# ```

# DATABASE\_URL=postgresql+psycopg://postgres:YOUR\_PASSWORD@localhost:5432/qa\_platform

# SECRET\_KEY=<random string>

# ALGORITHM=HS256

# ACCESS\_TOKEN\_EXPIRE\_MINUTES=60

# ```

# 

# Generate a secret key with `python -c "import secrets; print(secrets.token\_hex(32))"`. Avoid special characters such as `@ : / #` in the database password.

# 

# 6\. Create the tables:

# 

# ```

# alembic upgrade head

# ```

# 

# 7\. Start the server:

# 

# ```

# uvicorn app.main:app --reload

# ```

# 

# 8\. Open http://127.0.0.1:8000/docs for the Swagger UI.

# 

# 9\. New users are created with the `USER` role. To make the first Admin (after registering):

# 

# ```

# python -m app.make\_admin your-email@example.com

# ```

# 

# \## Project structure

# 

# ```

# app/

# &#x20; main.py             app entry point, routers are registered here

# &#x20; make\_admin.py       script to promote a user to Admin

# &#x20; core/               config (.env), database session, security (hashing, JWT)

# &#x20; models/             SQLAlchemy models (users, projects, project\_members)

# &#x20; schemas/            request and response schemas (validation)

# &#x20; api/deps.py         reusable dependencies (auth and permissions)

# &#x20; api/routes/         endpoints (auth, users, projects, members)

# alembic/              database migrations

# ```

# 

# \## Implemented endpoints

# 

# | Method | Endpoint | Access |

# |---|---|---|

# | POST | /api/auth/register | Public |

# | POST | /api/auth/login | Public (returns JWT) |

# | GET | /api/auth/me | Logged in |

# | GET | /api/users/ | Admin |

# | PATCH | /api/users/{user\_id} | Admin |

# | POST | /api/projects/ | Admin |

# | GET | /api/projects/ | Logged in (Admin sees all, others see their projects) |

# | GET | /api/projects/{project\_id} | Project member or Admin |

# | PATCH | /api/projects/{project\_id} | Admin |

# | DELETE | /api/projects/{project\_id} | Admin (soft delete) |

# | POST | /api/projects/{project\_id}/members/ | Admin |

# | GET | /api/projects/{project\_id}/members/ | Project member or Admin |

# | PATCH | /api/projects/{project\_id}/members/{member\_id} | Admin |

# | DELETE | /api/projects/{project\_id}/members/{member\_id} | Admin |

# 

# \## Roles and permissions

# 

# \- System role (`users.system\_role`): `ADMIN` or `USER`. Admins can manage users, projects and members.

# \- Project role (`project\_members.project\_role`): `QA\_ENGINEER`, `DEVELOPER` or `STAKEHOLDER`. Being a member gives access to that project only, not Admin rights.

# 

# \## Guide for teammates

# 

# \- Reusable dependencies live in `app/api/deps.py`:

# &#x20; - `get\_current\_user` returns the logged-in user from the JWT.

# &#x20; - `require\_admin` allows Admins only.

# &#x20; - `require\_project\_role(...)` checks project membership. With no arguments any member passes, or pass roles such as `ProjectRole.QA\_ENGINEER`. Admins always pass. The route must have a path parameter named `project\_id`.

# \- Add new models in `app/models/` (one file per area) and import them in `app/models/\_\_init\_\_.py` so Alembic sees them.

# \- Run `git pull` before creating a migration with `alembic revision --autogenerate -m "message"`, to avoid conflicting migrations.

