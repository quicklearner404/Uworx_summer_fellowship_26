# Comparing Prompts On Different LLM Models
## Prompt Used:

**Act as a Lead Software Engineer reviewing code for a high-traffic production service. Review the following snippet for performance bottlenecks, security vulnerabilities, and readability. Do not rewrite the entire function; instead, provide a point-by-point feedback list prioritized by severity (Critical, Major, Minor), followed by refactored code snippets for only the critical issues:**
```python
import sqlite3
import hashlib

def get_user_dashboard_data(user_input_id, user_input_password):
    # Connect to the production database
    conn = sqlite3.connect('app_production.db')
    cursor = conn.cursor()
    
    # Hash password using MD5
    hashed_password = hashlib.md5(user_input_password.encode()).hexdigest()
    
    # Authenticate user and fetch details
    query = f"SELECT id, username, email, is_admin FROM users WHERE id = '{user_input_id}' AND password = '{hashed_password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    if not user:
        return {"error": "Invalid credentials"}
    
    # Fetch all activity logs for this user to calculate total logins
    cursor.execute("SELECT * FROM activity_logs")
    all_logs = cursor.fetchall()
    
    user_logins = 0
    for log in all_logs:
        if log[1] == user[0] and log[2] == 'LOGIN':  # log[1] is user_id, log[2] is action
            user_logins += 1
            
    conn.close()
    
    return {
        "user_id": user[0],
        "username": user[1],
        "email": user[2],
        "is_admin": user[3],
        "total_logins": user_logins
    }
```
## RESPONSE
## Gemini 3.6 Flash
![Alternative text description](/assets/gemini3.6flash.png)
<details>
<summary>click to see full response</summary>
Here is a code review of the snippet, framing feedback around the requirements of a high-traffic production service.

---

## Code Review Feedback

### Critical

1. **SQL Injection Vulnerability (Security)**
* **Issue:** Direct string formatting (`f"SELECT ... WHERE id = '{user_input_id}'..."`) allows attackers to execute arbitrary SQL commands by supplying malicious input in `user_input_id`.
* **Impact:** Full database compromise, data exfiltration, or unauthorized admin bypass.


2. **Cryptographically Weak Password Hashing (Security)**
* **Issue:** `MD5` is computationally fast, un-salted, and trivially broken via rainbow tables and modern GPU brute-forcing.
* **Impact:** Credential leakage if the database is compromised. Production authentication systems must use adaptive key-derivation algorithms (e.g., Argon2, bcrypt, or PBKDF2).


3. **Catastrophic Memory & Network Bottleneck (Performance)**
* **Issue:** `SELECT * FROM activity_logs` combined with `cursor.fetchall()` loads the **entire** activity history of all users into application RAM to count a single metric in Python ($O(N)$ execution time).
* **Impact:** Severe latency, massive database IO, and eventual Out-Of-Memory (OOM) crashes as the table grows.



---

### Major

1. **Resource Leak & Unhandled Exceptions (Reliability)**
* **Issue:** `conn.close()` is called manually at the end of execution without error handling (`try/finally` or a context manager). If an exception occurs during execution, the database connection remains open.
* **Impact:** File handle leaks and connection exhaustion under load.


2. **SQLite for High-Traffic Production (Architecture)**
* **Issue:** SQLite relies on database-level locking for writes and lacks full concurrency support required for high throughput.
* **Impact:** Transaction blocking and bottlenecking under heavy concurrent requests. (Consider PostgreSQL or MySQL for high-traffic environments).



---

### Minor

1. **Magic Tuple Indexing (Readability & Maintainability)**
* **Issue:** Accessing database results via hardcoded indices (`user[0]`, `user[1]`) makes the code fragile to schema updates.
* **Impact:** Poor developer ergonomics and high likelihood of regression bugs if columns are reordered. Use `sqlite3.Row` to enable dict-style access (`user['id']`).



---

## Refactored Snippets (Critical Fixes)

Below are the targeted refactors addressing the **Critical** security and performance flaws:

### 1. Parameterized Query & SQL Aggregation

Replace string interpolation and Python-side filtering with parameterized queries and direct SQL counts:

```python
# 1. Parameterized authentication query (Fixes SQL Injection)
auth_query = """
    SELECT id, username, email, is_admin 
    FROM users 
    WHERE id = ? AND password = ?
"""
cursor.execute(auth_query, (user_input_id, hashed_password))
user = cursor.fetchone()

if not user:
    return {"error": "Invalid credentials"}

# 2. Database-level aggregation (Fixes Memory Bottleneck)
count_query = """
    SELECT COUNT(*) 
    FROM activity_logs 
    WHERE user_id = ? AND action = 'LOGIN'
"""
cursor.execute(count_query, (user[0],))
user_logins = cursor.fetchone()[0]

```

---

### 2. Secure Password Verification

Replace `MD5` with standard library `hashlib.pbkdf2_hmac` (or an external library like `bcrypt`/`argon2` in production):

```python
import hashlib
import secrets

def verify_password(stored_password_hash: bytes, salt: bytes, provided_password: str) -> bool:
    """Verifies a password using PBKDF2 with HMAC-SHA256."""
    computed_hash = hashlib.pbkdf2_hmac(
        'sha256',
        provided_password.encode('utf-8'),
        salt,
        iterations=600_000
    )
    return secrets.compare_digest(computed_hash, stored_password_hash)

```
</details>

## Gemini 3.1 Pro
![Alternative text description](/assets/gemini3.1pro.png)
<details>
<summary>click to see full response</summary>
Here is my review of the function. For a high-traffic production service, there are a few severe bottlenecks and security vulnerabilities here that would likely bring the service down or lead to a data breach.

Here is the prioritized feedback.

### 🔴 Critical Severity

1. **SQL Injection Vulnerability:** The authentication query uses f-strings to directly interpolate `user_input_id` and `hashed_password` into the SQL statement. A malicious user could pass a crafted string (e.g., `' OR '1'='1`) to bypass authentication or drop tables.
2. **Catastrophic Memory/Performance Bottleneck:** You are executing `SELECT * FROM activity_logs` and pulling the entire table into application memory to count logins for a single user. In a high-traffic system, this will cause extreme latency, exhaust server memory (OOM), and crash the application instantly. The database should be doing the counting.
3. **Weak Password Hashing:** MD5 is cryptographically broken and extremely fast to crack using rainbow tables or modern GPUs. It lacks a unique salt per user, meaning identical passwords result in identical hashes.

### 🟠 Major Severity

1. **Unsafe Connection Handling:** The database connection is closed manually at the very end of the function. If an exception occurs during the SQL queries, the `conn.close()` statement is never reached, causing a connection leak that will eventually lock the database.
2. **SQLite in High-Traffic Production:** While SQLite is amazing, it uses database-level (or table-level) locking during writes. For a truly "high-traffic" service, this usually leads to `database is locked` errors unless it is a strictly read-only workload. You should evaluate moving to PostgreSQL or MySQL, or at least use connection pooling and WAL (Write-Ahead Logging) mode.

### 🟡 Minor Severity

1. **Magic Index Numbers:** Accessing tuple indices like `log[1]` or `user[2]` makes the code hard to read and brittle. If the schema changes and column orders shift, this code will silently break. Use `sqlite3.Row` to access columns by their names (e.g., `user["email"]`).
2. **Error Handling Pattern:** Returning a dictionary with an `"error"` key forces the calling function to manually check for this key on every response. It is much cleaner and more Pythonic to raise a custom exception (e.g., `AuthenticationError`).

---

## Refactored Critical Issues

Here are the snippets demonstrating how to fix the critical flaws.

### 1. Fixing SQL Injection (Use Parameterized Queries)

Never use f-strings or string concatenation for SQL. Pass the variables as a tuple to the `execute` method, allowing the database driver to safely sanitize the inputs.

```python
# Safe authentication query using parameterized inputs (?)
query = "SELECT id, username, email, is_admin FROM users WHERE id = ? AND password = ?"
cursor.execute(query, (user_input_id, hashed_password))
user = cursor.fetchone()

```

### 2. Fixing the Performance Bottleneck (Let SQL do the math)

Instead of fetching all logs into memory and using a Python `for` loop, use SQL's `COUNT()` function filtered by a `WHERE` clause. This shifts the workload to the database engine, reducing memory usage from gigabytes down to a few bytes.

```python
# Fetching ONLY the count of login actions for the specific user
count_query = "SELECT COUNT(*) FROM activity_logs WHERE user_id = ? AND action = 'LOGIN'"
cursor.execute(count_query, (user[0],))
user_logins = cursor.fetchone()[0]

```

### 3. Fixing Password Hashing (Conceptual)

You must migrate away from MD5 immediately. You should use a strong, slow hashing algorithm like `bcrypt` or `Argon2`. Here is how the authentication check should look using the standard `bcrypt` library:

```python
import bcrypt

# First, fetch the user by ID ONLY
cursor.execute("SELECT id, username, email, is_admin, password FROM users WHERE id = ?", (user_input_id,))
user = cursor.fetchone()

# Then, securely verify the password using bcrypt
# (Assumes the stored password is a bcrypt hash)
if not user or not bcrypt.checkpw(user_input_password.encode(), user[4].encode()):
    return {"error": "Invalid credentials"}

```
</details>

## GPT 4.0
![Alternative text description](/assets/gpt4.0.png)
<details>
<summary> click to see full response</summary>

## Code Review (Prioritized by Severity)

### 🔴 Critical

1. **SQL Injection Vulnerability**

   * The SQL query is built using an f-string with user-controlled input (`user_input_id`).
   * An attacker could manipulate the query (e.g., `1' OR '1'='1`) to bypass authentication or access unauthorized data.
   * **Impact:** Authentication bypass, data leakage, potential database compromise.
   * **Recommendation:** Use parameterized queries (`?` placeholders in SQLite).

2. **Insecure Password Hashing (MD5)**

   * MD5 is cryptographically broken and extremely fast, making it vulnerable to brute-force and rainbow table attacks.
   * Modern applications should never use MD5 for password storage or verification.
   * **Impact:** Passwords can be recovered if the database is leaked.
   * **Recommendation:** Use a password hashing algorithm designed for authentication, such as:

     * `bcrypt`
     * `Argon2` (preferred)
     * `PBKDF2`

3. **Inefficient Retrieval of Activity Logs**

   * The code retrieves **every record** from `activity_logs` and filters them in Python.
   * For a production system with millions of logs, this becomes extremely slow and memory-intensive.
   * **Impact:** Poor scalability, excessive memory usage, slow response times.
   * **Recommendation:** Let the database perform the counting using `COUNT(*)` with a `WHERE` clause.

---

### 🟠 Major

1. **Database Connection Not Guaranteed to Close**

   * If an exception occurs before `conn.close()`, the connection remains open.
   * This can eventually exhaust available database connections.
   * **Recommendation:** Use a context manager (`with sqlite3.connect(...) as conn:`) or a `try/finally` block.

2. **No Exception Handling**

   * Database failures (missing database, locked database, malformed queries) will crash the function.
   * Production services should gracefully handle database errors and log them appropriately.

3. **Hardcoded Database Path**

   * `'app_production.db'` is embedded directly in the code.
   * Environment-specific configuration should come from configuration files or environment variables.

4. **Authentication and Data Retrieval Coupled**

   * Authentication logic and dashboard aggregation are mixed together.
   * Separating responsibilities improves maintainability and testing.

---

### 🟡 Minor

1. **Magic Indexes Reduce Readability**

   * Expressions like `log[1]` and `log[2]` make the code harder to understand.
   * Using named columns (`sqlite3.Row`) or constants improves readability.

2. **Comment Doesn't Add Much Value**

   * Comments such as `# Connect to the production database` merely restate the code.
   * Comments should explain *why*, not *what*.

3. **Function Name Is Long**

   * `get_user_dashboard_data` is descriptive but somewhat verbose.
   * A shorter name such as `fetch_dashboard_data` could improve readability while remaining clear.

4. **No Type Hints**

   * Adding type hints would improve IDE support and maintainability.

---

# Refactored Code Snippets (Critical Issues Only)

### 1. Fix SQL Injection with Parameterized Queries

```python
query = """
SELECT id, username, email, is_admin
FROM users
WHERE id = ? AND password = ?
"""

cursor.execute(query, (user_input_id, hashed_password))
user = cursor.fetchone()
```

---

### 2. Replace MD5 with a Secure Password Verification Method (bcrypt Example)

```python
import bcrypt

cursor.execute(
    "SELECT id, username, email, is_admin, password FROM users WHERE id = ?",
    (user_input_id,)
)

user = cursor.fetchone()

if not user or not bcrypt.checkpw(
    user_input_password.encode(),
    user[4].encode()
):
    return {"error": "Invalid credentials"}
```

> This assumes passwords are stored as bcrypt hashes rather than MD5 hashes.

---

### 3. Count Logins Directly in SQL

```python
cursor.execute(
    """
    SELECT COUNT(*)
    FROM activity_logs
    WHERE user_id = ? AND action = 'LOGIN'
    """,
    (user[0],)
)

user_logins = cursor.fetchone()[0]
```

This avoids loading the entire `activity_logs` table into memory and scales much better for production workloads.

</details>

## comparison and analysis:
**Accuracy Across All 3:** All three models successfully caught the 3 core Critical issues (SQL Injection, MD5, and $O(N)$ memory loading via SELECT *).

**Architectural Realism:** Response 1 stood out by recognizing that SQLite itself is fundamentally the wrong tool for high-traffic write loads, going beyond just the Python code.

**Execution Quality:** Response 1 provided the most copy-paste ready, production-safe snippets without syntax or formatting artifacts.