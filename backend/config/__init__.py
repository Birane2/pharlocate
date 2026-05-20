"""Database driver compatibility for Django MySQL backends.

Prefer `mysqlclient` (`MySQLdb`) when available. Fall back to `pymysql`
only if it is installed.
"""

try:
    import MySQLdb  # noqa: F401
except ImportError:
    import pymysql

    pymysql.install_as_MySQLdb()
