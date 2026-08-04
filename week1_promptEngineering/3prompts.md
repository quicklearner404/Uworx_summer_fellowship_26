# Comparing Prompts On Different LLM Models
## Prompt Used:
### Role Based Prompt
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

### COT prompt
**Analyze the following Python code step-by-step for a production system environment: Step 1: Audit the code for security vulnerabilities (e.g., SQL execution, password handling). Step 2: Audit database query efficiency and memory utilization under high-traffic conditions. Step 3: Audit code readability, maintainability, and exception safety. Step 4: Consolidate your findings into a prioritized list grouped strictly by severity (Critical, Major, Minor). Do not rewrite the full function. Step 5: Provide refactored code snippets ONLY for the Critical severity issues identified. Code to review:**
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
### Few Shot Prompt

**Review code snippets using the exact evaluation structure shown in the example below.**

```python
def get_user(user_id):
conn = sqlite3.connect('db.db')
res = conn.execute(f"SELECT * FROM users WHERE id = {user_id}")
return res.fetchone()

[Example Target Output Format]

Prioritized Feedback
Critical: SQL Injection vulnerability via raw string interpolation.

Major: Database connection is opened per function without closing context.

Minor: Variable res is vaguely named.

Refactored Code (Critical Issues Only)
res = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```

Now, review the target code snippet below for performance bottlenecks, security vulnerabilities, and readability. Follow the example's structure: provide a point-by-point list prioritized by severity (Critical, Major, Minor), followed by refactored code snippets for ONLY the critical issues. Do not rewrite the full function.

Target Code:
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
## GPT 4.0
![Alternative text description](/assets/gpt4.0.png)
<details>
<summary> click to see full response</summary>
<details>
<summary>click to see role based prompt response</summary>
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
<details><summary>click to see COT prompt</summary>
## Step 1: Security Audit

### 1. SQL Injection (Critical)

* The authentication query is constructed using an f-string:

  ```python
  query = f"SELECT ... WHERE id = '{user_input_id}' AND password = '{hashed_password}'"
  ```
* Since `user_input_id` comes directly from user input, an attacker can inject SQL (e.g., `' OR '1'='1`), potentially bypassing authentication or accessing unauthorized data.
* **Risk:** Authentication bypass, unauthorized data access, database compromise.
* **Recommendation:** Use parameterized queries (`?` placeholders in SQLite).

---

### 2. Weak Password Hashing (Critical)

* Passwords are hashed using MD5:

  ```python
  hashlib.md5(user_input_password.encode()).hexdigest()
  ```
* MD5 is cryptographically broken and designed for speed, making it vulnerable to brute-force and rainbow table attacks.
* **Risk:** Password disclosure if the database is compromised.
* **Recommendation:** Use a password hashing algorithm intended for authentication, such as:

  * Argon2 (preferred)
  * bcrypt
  * PBKDF2

---

### 3. Information Disclosure (Minor)

* The returned user object includes the user's email address.
* If authorization checks elsewhere are insufficient, exposing personally identifiable information (PII) may increase risk.
* Ensure the caller is authorized to receive these fields.

---

## Step 2: Database Query Efficiency & Memory Audit

### 1. Full Table Scan of Activity Logs (Critical)

* The code retrieves every row:

  ```python
  cursor.execute("SELECT * FROM activity_logs")
  all_logs = cursor.fetchall()
  ```
* Filtering is then performed in Python.
* Under high traffic or large datasets:

  * unnecessary disk I/O
  * high memory consumption
  * increased response latency
  * poor scalability
* **Recommendation:** Let the database perform the filtering and counting using `COUNT(*)` with an appropriate `WHERE` clause.

---

### 2. `fetchall()` Memory Usage (Major)

* `fetchall()` loads the complete result set into memory.
* If `activity_logs` contains millions of rows, this can consume significant memory and degrade performance.
* Even if filtering remained in Python, streaming rows would be preferable, though SQL aggregation is the better solution.

---

### 3. Authentication Query Efficiency (Minor)

* Authentication filters on:

  * `id`
  * `password`
* If the user ID is already unique or a primary key, fetching by ID first and verifying the password separately is generally more efficient and aligns better with modern password verification practices.

---

## Step 3: Readability, Maintainability & Exception Safety

### Readability

* Uses tuple indexes:

  ```python
  log[1]
  log[2]
  ```

  which obscure the meaning of each field.

* Comments largely describe *what* the code does instead of *why*.

* Function performs multiple responsibilities:

  * database connection
  * authentication
  * dashboard aggregation
  * response construction

  Separating these responsibilities would improve maintainability.

---

### Maintainability

* Hardcoded database path:

  ```python
  sqlite3.connect("app_production.db")
  ```

  should come from configuration or environment variables.

* No type hints or documentation.

* Database schema assumptions (e.g., `log[1]`) are implicit.

---

### Exception Safety

#### Major

The connection is closed only at the end:

```python
conn.close()
```

If any earlier operation raises an exception:

* database remains open
* resources leak
* repeated failures may exhaust available connections

A context manager (`with sqlite3.connect(...) as conn:`) or `try/finally` should be used.

---

#### Major

No exception handling exists for:

* database unavailable
* malformed SQL
* locked database
* corrupted database

In production, these should be handled appropriately with logging and safe error responses.

---

# Step 4: Prioritized Findings

## 🔴 Critical

1. SQL Injection through string-formatted SQL query.
2. Insecure password hashing using MD5.
3. Entire `activity_logs` table is loaded and filtered in Python instead of using SQL aggregation.

---

## 🟠 Major

1. `fetchall()` loads the complete result set into memory.
2. Database connection is not exception-safe and may leak resources.
3. No database exception handling.
4. Multiple responsibilities combined into a single function.

---

## 🟡 Minor

1. Magic tuple indexes (`log[1]`, `log[2]`) reduce readability.
2. Hardcoded database path.
3. Authentication query could better align with modern password verification by fetching the user first.
4. Comments add little value beyond describing obvious operations.
5. Missing type hints/documentation.
6. Ensure returned user information (e.g., email) is appropriate for the caller.

---

# Step 5: Refactored Code Snippets (Critical Issues Only)

### 1. Prevent SQL Injection with Parameterized Queries

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

### 2. Replace MD5 with Secure Password Verification (bcrypt Example)

```python
import bcrypt

cursor.execute(
    """
    SELECT id, username, email, is_admin, password
    FROM users
    WHERE id = ?
    """,
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

### 3. Count User Logins in SQL Instead of Loading All Logs

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

This approach eliminates the full-table read, minimizes memory usage, and allows the database engine to efficiently compute the result using indexes where available.

</details>

<details><summary>click to see few shot prompt response</summary>
## Prioritized Feedback

**Critical:** SQL Injection vulnerability due to raw string interpolation in the authentication query (`f"... WHERE id = '{user_input_id}' ..."`). Use parameterized queries.

**Critical:** Insecure password hashing using MD5. MD5 is not suitable for password storage or verification because it is vulnerable to brute-force and rainbow table attacks. Use a password hashing algorithm such as Argon2, bcrypt, or PBKDF2.

**Critical:** Entire `activity_logs` table is loaded into memory and filtered in Python. This does not scale for high-traffic systems. Perform the filtering and counting in SQL using `COUNT(*)` and a `WHERE` clause.

**Major:** Database connection is not exception-safe. If an exception occurs before `conn.close()`, the connection may remain open. Use a context manager or `try/finally`.

**Major:** `fetchall()` loads every matching row into memory, increasing memory usage on large datasets.

**Major:** The function combines authentication, database access, and dashboard aggregation, reducing maintainability and testability.

**Minor:** Magic tuple indexes (`log[1]`, `log[2]`) reduce readability. Prefer named columns or constants.

**Minor:** Hardcoded database path (`app_production.db`) reduces configuration flexibility.

**Minor:** Comments mostly restate the code rather than explaining implementation decisions.

---

## Refactored Code (Critical Issues Only)

### Prevent SQL Injection

```python
query = """
SELECT id, username, email, is_admin
FROM users
WHERE id = ? AND password = ?
"""

cursor.execute(query, (user_input_id, hashed_password))
```

### Replace MD5 with Secure Password Verification

```python
import bcrypt

cursor.execute(
    """
    SELECT id, username, email, is_admin, password
    FROM users
    WHERE id = ?
    """,
    (user_input_id,)
)

user = cursor.fetchone()

if not user or not bcrypt.checkpw(
    user_input_password.encode(),
    user[4].encode()
):
    return {"error": "Invalid credentials"}
```

### Count Logins in SQL Instead of Loading All Logs

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

</details>
</details>

## Gemini 3.6 Flash
![Alternative text description](/assets/gemini3.6flash.png)
<details>
<summary>click to see full response</summary>
<details><summary>click to see role based prompt response </summary>
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
<details><summary>click to see COT prompt response</summary>Here is the step-by-step code audit for your Python function.

---

## Step 1: Security Audit

1. **SQL Injection:** Direct f-string interpolation (`f"SELECT ... WHERE id = '{user_input_id}' ..."` ) inserts untrusted user input straight into the SQL query string. An attacker can alter the query logic to bypass authentication or execute arbitrary database statements.
2. **Insecure Password Hashing (MD5):** `hashlib.md5()` is cryptographically broken and extremely fast to compute. It provides zero protection against brute-force, dictionary, or rainbow table attacks. Modern password hashing requires slow, salted algorithms like `bcrypt`, `Argon2`, or `PBKDF2`.

## Step 2: Database Query & Memory Efficiency Audit

1. **Unfiltered Full-Table Scan (`SELECT *`):** `cursor.execute("SELECT * FROM activity_logs")` queries every single row in the database table regardless of who it belongs to.
2. **In-Memory Filtering & Excessive RAM Usage:** Using `fetchall()` transfers the entire contents of the `activity_logs` table into Python memory, iterating through every record using a loop. Under high-traffic or large-dataset conditions, this will cause extreme memory spikes and crash the application.
3. **Missing SQL Aggregation:** Counting logins should be performed directly engine-side using `COUNT(*)` and indexed `WHERE` filters (`WHERE user_id = ? AND action = 'LOGIN'`).

## Step 3: Readability, Maintainability & Exception Safety Audit

1. **Exception Safety / Connection Leaks:** If an exception occurs during query execution or processing, `conn.close()` will never be reached, leaking database connections. Connection handling must use a context manager (`with sqlite3.connect(...)`) or a `try...finally` block.
2. **Magic Index Numbers:** Array indexing like `log[1]`, `log[2]`, `user[0]` reduces readability and creates brittle code that breaks silently if database schema column orders change.
3. **Single-Responsibility Violation:** The function combines authentication, data retrieval, business logic, and reporting in a single scope.
4. **Hardcoded Configuration:** The database filename (`app_production.db`) is hardcoded inside the core logic instead of being injected or configured externally.

---

## Step 4: Prioritized Audit Findings

### Critical

* **SQL Injection Vulnerability:** Raw string interpolation allows attacker-controlled query execution.
* **Insecure Password Hashing (MD5):** MD5 is vulnerable to rapid brute-force attacks.
* **Full-Table Memory Exhaustion:** Loading all `activity_logs` into Python RAM via `fetchall()` will crash the application under scale.

### Major

* **Connection Leak / Missing Exception Safety:** DB connection is not wrapped in a context manager; exceptions leave connections open.
* **Lack of Database-Side Aggregation:** Performs counting in Python loops rather than delegating `COUNT(*)` to the database engine.
* **Architectural Coupling:** Authentication, DB access, and dashboard generation are tightly coupled in one function.

### Minor

* **Magic Positional Indexes:** Reliance on tuple indices (`user[0]`, `log[1]`) reduces readability and schema flexibility.
* **Hardcoded DB Path:** Hardcoded `'app_production.db'` string limits testability and configuration reuse.

---

## Step 5: Refactored Code Snippets (Critical Issues Only)

### 1. Fix SQL Injection & Implement Secure Password Verification

Instead of storing/comparing MD5 hashes directly in a raw string, use parameterized placeholders (`?`) to fetch the stored hash securely, then verify it with `bcrypt`.

```python
import bcrypt
import sqlite3

# 1. Parameterized query prevents SQL Injection
query = """
    SELECT id, username, email, is_admin, password 
    FROM users 
    WHERE id = ?
"""
cursor.execute(query, (user_input_id,))
user = cursor.fetchone()

# 2. Secure password verification (bcrypt)
if not user or not bcrypt.checkpw(user_input_password.encode('utf-8'), user[4].encode('utf-8')):
    return {"error": "Invalid credentials"}

```

### 2. Fix Full-Table Memory Exhaustion with Database Aggregation

Replace the full-table scan (`SELECT *`) and Python loop with targeted filtering and engine-side aggregation (`COUNT(*)`).

```python
# Aggregate directly in SQL using indexed parameters instead of fetchall()
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
</details>

<details><summary>click to see few shot prompt response</summary>You’ve got a solid analysis here! The refactored snippets address the biggest security and performance bottlenecks cleanly.

If you're aiming to take this refactor all the way across the finish line, here is how you can bundle those critical security and performance fixes—along with the major exception-safety issue—into a clean, idiomatic Python function:

```python
import sqlite3
import bcrypt

def get_user_dashboard_data(db_path: str, user_input_id: str, user_input_password: str):
    # Fix (Major): Use a context manager to guarantee connection cleanup
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        # Fix (Critical): Parameterized query prevents SQL Injection
        cursor.execute(
            """
            SELECT id, username, email, is_admin, password
            FROM users
            WHERE id = ?
            """,
            (user_input_id,)
        )
        user = cursor.fetchone()

        # Fix (Critical): Secure password verification using bcrypt instead of MD5
        if not user or not bcrypt.checkpw(user_input_password.encode('utf-8'), user[4].encode('utf-8')):
            return {"error": "Invalid credentials"}

        # Fix (Critical & Major): Database-side aggregation avoids loading thousands of logs into RAM
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM activity_logs
            WHERE user_id = ? AND action = 'LOGIN'
            """,
            (user[0],)
        )
        user_logins = cursor.fetchone()[0]

        return {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "is_admin": user[3],
            "total_logins": user_logins,
        }

```

### Next Steps for Architecture & Maintainability

If you decide to tackle the **Major** and **Minor** issues next:

1. **Decouple Responsibilities:** Extract the database access layer into a separate repository or service class.
2. **Replace Magic Tuples:** Configure `sqlite3.Row` (`conn.row_factory = sqlite3.Row`) to access columns by name (e.g., `user["password"]`) rather than rigid positional indices like `user[4]`.
</details>
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



## Comparative Analysis of Prompting Techniques

Three prompting techniques were evaluated on the same code review task: **Role-Based Prompting**, **Chain-of-Thought (CoT) Prompting**, and **Few-Shot Prompting**.

* **Role-Based Prompting** produced responses from the perspective of a Lead Software Engineer, emphasizing production-level concerns such as security, scalability, and maintainability. The feedback was professional and practical but relied on the model's implicit reasoning.

* **Chain-of-Thought Prompting** generated the most comprehensive analysis by guiding the model through a step-by-step review process. It consistently covered security, performance, readability, exception handling, and maintainability, making it the most thorough approach.

* **Few-Shot Prompting** produced the most consistent output format by following the provided example. While the technical analysis remained accurate, its primary strength was maintaining a structured and predictable response rather than improving reasoning depth.

### Overall Comparison

| Technique        | Strength                                  | Limitation                        |
| ---------------- | ----------------------------------------- | --------------------------------- |
| Role-Based       | Professional, production-focused feedback | Less structured reasoning         |
| Chain-of-Thought | Most complete and systematic analysis     | Longer responses                  |
| Few-Shot         | Consistent formatting and organization    | Limited impact on reasoning depth |

### Conclusion

Among the three techniques, **Chain-of-Thought Prompting** produced the highest-quality analysis due to its structured reasoning process. **Few-Shot Prompting** was most effective for maintaining consistent formatting, while **Role-Based Prompting** generated the most realistic professional code review.
