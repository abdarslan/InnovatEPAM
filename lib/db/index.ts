import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { and, eq, inArray } from 'drizzle-orm'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL ?? './data/innovatepam.db'

const sqlite = new Database(DATABASE_URL)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })

export async function getIdeaRatingsByIdeaIds(ideaIds: number[]) {
	if (ideaIds.length === 0) {
		return []
	}

	return db
		.select({
			id: schema.ideaRatings.id,
			ideaId: schema.ideaRatings.ideaId,
			stage: schema.ideaRatings.stage,
			score: schema.ideaRatings.score,
			raterId: schema.ideaRatings.raterId,
			createdAt: schema.ideaRatings.createdAt,
			updatedAt: schema.ideaRatings.updatedAt,
		})
		.from(schema.ideaRatings)
		.where(inArray(schema.ideaRatings.ideaId, ideaIds))
}

export async function getIdeaRatingByIdeaAndStage(
	ideaId: number,
	stage: schema.IdeaRatingStage,
) {
	const rows = await db
		.select({
			id: schema.ideaRatings.id,
			ideaId: schema.ideaRatings.ideaId,
			stage: schema.ideaRatings.stage,
			score: schema.ideaRatings.score,
			raterId: schema.ideaRatings.raterId,
			createdAt: schema.ideaRatings.createdAt,
			updatedAt: schema.ideaRatings.updatedAt,
		})
		.from(schema.ideaRatings)
		.where(and(eq(schema.ideaRatings.ideaId, ideaId), eq(schema.ideaRatings.stage, stage)))
		.limit(1)

	return rows[0] ?? null
}
