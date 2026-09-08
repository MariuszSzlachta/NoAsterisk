import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc, asc, gte, lte, ilike } from 'drizzle-orm';
import { Transaction, Money, isTransactionType } from '@budget/domain';
import {
  TransactionRepository,
  TransactionFilter,
  TransactionSortField,
} from '@transactions/application/ports/transaction.repository';
import {
  PagedQuery,
  PagedResult,
  SortDirection,
} from '@shared/application/types/paged-query.types';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { transactions } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresTransactionRepository implements TransactionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(transaction: Transaction): Promise<Transaction> {
    await this.db
      .insert(transactions)
      .values(this.toPersistence(transaction))
      .onConflictDoUpdate({
        target: transactions.id,
        set: {
          title: transaction.description,
          amount: transaction.money.amount.toString(),
          currency: transaction.money.currency,
          type: transaction.type,
          date: transaction.date,
          categoryIds: [...transaction.categoryIds],
          budgetId: transaction.budgetId ?? null,
        },
      });
    return transaction;
  }

  async saveMany(txns: Transaction[]): Promise<void> {
    if (txns.length === 0) return;
    await this.db
      .insert(transactions)
      .values(txns.map((t) => this.toPersistence(t)));
  }

  // ARCH-EXCEPTION: global-scope findById — UUID is unguessable,
  // handler verifies workspace ownership post-fetch. Defense-in-depth gap accepted.
  async findById(id: string): Promise<Transaction | undefined> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return this.toDomain(rows[0]);
  }

  async findUncategorized(workspaceId: string): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          sql`${transactions.categoryIds} = '[]'::jsonb`,
        ),
      );
    return rows
      .map((r) => this.toDomain(r))
      .filter((t): t is Transaction => t !== undefined);
  }

  async findPaged(
    workspaceId: string,
    query: PagedQuery<TransactionFilter, TransactionSortField>,
  ): Promise<PagedResult<Transaction>> {
    const { page, sort, filter } = query;
    const offset = (page.page - 1) * page.limit;

    const conditions = [eq(transactions.workspaceId, workspaceId)];

    if (filter?.type) {
      conditions.push(eq(transactions.type, filter.type));
    }
    if (filter?.categoryIds && filter.categoryIds.length > 0) {
      for (const catId of filter.categoryIds) {
        conditions.push(
          sql`${transactions.categoryIds} @> ${JSON.stringify([catId])}::jsonb`,
        );
      }
    }
    if (filter?.dateFrom) {
      conditions.push(gte(transactions.date, filter.dateFrom));
    }
    if (filter?.dateTo) {
      conditions.push(lte(transactions.date, filter.dateTo));
    }
    if (filter?.amountMin !== undefined) {
      conditions.push(gte(transactions.amount, filter.amountMin.toString()));
    }
    if (filter?.amountMax !== undefined) {
      conditions.push(lte(transactions.amount, filter.amountMax.toString()));
    }
    if (filter?.description) {
      const escaped = filter.description.replace(/[%_\\]/g, '\\$&');
      conditions.push(ilike(transactions.title, `%${escaped}%`));
    }

    const whereClause = and(...conditions);

    const sortColumn = this.getSortColumn(sort?.field ?? 'date');
    const sortDir =
      sort?.direction === SortDirection.Asc
        ? asc(sortColumn)
        : desc(sortColumn);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(sortDir)
        .limit(page.limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: rows
        .map((r) => this.toDomain(r))
        .filter((t): t is Transaction => t !== undefined),
      meta: {
        page: page.page,
        limit: page.limit,
        total,
        totalPages: Math.ceil(total / page.limit),
      },
    };
  }

  async existsByCategoryId(categoryId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        sql`${transactions.categoryIds} @> ${JSON.stringify([categoryId])}::jsonb`,
      )
      .limit(1);
    return rows.length > 0;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(transactions).where(eq(transactions.id, id));
  }

  private toPersistence(t: Transaction): typeof transactions.$inferInsert {
    return {
      id: t.id,
      workspaceId: t.workspaceId,
      accountId: t.accountId,
      title: t.description,
      amount: t.money.amount.toString(),
      currency: t.money.currency,
      type: t.type,
      date: t.date,
      categoryIds: [...t.categoryIds],
      contentHash: t.contentHash ?? null,
      budgetId: t.budgetId ?? null,
      balance: t.balance?.toString() ?? null,
      createdAt: t.createdAt,
    };
  }

  private toDomain(
    row: typeof transactions.$inferSelect | undefined,
  ): Transaction | undefined {
    if (!row) return undefined;
    if (!isTransactionType(row.type)) {
      throw new Error(
        `Corrupted DB data: invalid transaction type '${row.type}'`,
      );
    }
    return new Transaction(
      row.id,
      row.workspaceId,
      row.accountId,
      Money.of(Number(row.amount), row.currency),
      row.type,
      row.categoryIds as string[],
      row.title,
      row.date,
      row.createdAt,
      row.contentHash ?? undefined,
      row.balance ? Number(row.balance) : undefined,
      row.budgetId ?? undefined,
    );
  }

  private getSortColumn(field: TransactionSortField) {
    const map = {
      date: transactions.date,
      amount: transactions.amount,
      type: transactions.type,
      createdAt: transactions.createdAt,
    } as const;
    return map[field];
  }
}
