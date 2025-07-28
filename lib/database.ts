import Database from "better-sqlite3"
import { hash, compare } from "bcryptjs"
import path from "path"

const dbPath = path.join(process.cwd(), "database.sqlite")
const db = new Database(dbPath)

// Initialize database tables
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Analyses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      disease TEXT NOT NULL,
      confidence REAL NOT NULL,
      severity TEXT NOT NULL,
      description TEXT,
      symptoms TEXT,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `)

  // Medications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      FOREIGN KEY (analysis_id) REFERENCES analyses (id)
    )
  `)

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `)

  // Create default admin user if not exists
  const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@skincare-ai.com")
  if (!adminExists) {
    const hashedPassword = hash("admin123", 12)
    db.prepare(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run("admin@skincare-ai.com", hashedPassword, "Administrator", "admin")
  }
}

// User operations
export const userOperations = {
  create: async (email: string, password: string, name: string) => {
    const hashedPassword = await hash(password, 12)
    return db
      .prepare(`
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `)
      .run(email, hashedPassword, name)
  },

  findByEmail: (email: string) => {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email)
  },

  findById: (id: number) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id)
  },

  verifyPassword: async (password: string, hashedPassword: string) => {
    return await compare(password, hashedPassword)
  },

  getAll: () => {
    return db.prepare("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC").all()
  },

  getStats: () => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get() as { count: number }
    const activeUsers = db
      .prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM analyses 
      WHERE created_at > datetime('now', '-7 days')
    `)
      .get() as { count: number }

    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
    }
  },
}

// Analysis operations
export const analysisOperations = {
  create: (userId: number, imagePath: string, result: any) => {
    const analysis = db
      .prepare(`
      INSERT INTO analyses (user_id, image_path, disease, confidence, severity, description, symptoms, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        userId,
        imagePath,
        result.disease,
        result.confidence,
        result.severity,
        result.description,
        JSON.stringify(result.symptoms),
        JSON.stringify(result.recommendations),
      )

    // Insert medications
    if (result.medications) {
      const medicationStmt = db.prepare(`
        INSERT INTO medications (analysis_id, name, dosage, frequency)
        VALUES (?, ?, ?, ?)
      `)

      result.medications.forEach((med: any) => {
        medicationStmt.run(analysis.lastInsertRowid, med.name, med.dosage, med.frequency)
      })
    }

    return analysis
  },

  getByUserId: (userId: number) => {
    const analyses = db
      .prepare(`
      SELECT a.*, u.name as user_name
      FROM analyses a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `)
      .all(userId)

    return analyses.map((analysis: any) => ({
      ...analysis,
      symptoms: JSON.parse(analysis.symptoms || "[]"),
      recommendations: JSON.parse(analysis.recommendations || "[]"),
      medications: medicationOperations.getByAnalysisId(analysis.id),
    }))
  },

  getAll: () => {
    const analyses = db
      .prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM analyses a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `)
      .all()

    return analyses.map((analysis: any) => ({
      ...analysis,
      symptoms: JSON.parse(analysis.symptoms || "[]"),
      recommendations: JSON.parse(analysis.recommendations || "[]"),
      medications: medicationOperations.getByAnalysisId(analysis.id),
    }))
  },

  getStats: () => {
    const totalAnalyses = db.prepare("SELECT COUNT(*) as count FROM analyses").get() as { count: number }
    const diseaseDistribution = db
      .prepare(`
      SELECT disease, COUNT(*) as count
      FROM analyses
      GROUP BY disease
      ORDER BY count DESC
    `)
      .all()

    return {
      totalAnalyses: totalAnalyses.count,
      diseaseDistribution,
    }
  },
}

// Medication operations
export const medicationOperations = {
  getByAnalysisId: (analysisId: number) => {
    return db.prepare("SELECT * FROM medications WHERE analysis_id = ?").all(analysisId)
  },
}

// Session operations
export const sessionOperations = {
  create: (userId: number) => {
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(sessionId, userId, expiresAt.toISOString())

    return sessionId
  },

  findById: (sessionId: string) => {
    return db
      .prepare(`
      SELECT s.*, u.id as user_id, u.email, u.name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
      .get(sessionId)
  },

  delete: (sessionId: string) => {
    return db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
  },

  cleanup: () => {
    return db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run()
  },
}

// Initialize database on import
initializeDatabase()

export default db
