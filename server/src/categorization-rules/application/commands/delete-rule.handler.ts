import { Injectable, Inject } from '@nestjs/common';
import {
  CATEGORIZATION_RULE_REPOSITORY,
  CategorizationRuleRepository,
} from '@categorization-rules/application/ports/categorization-rule.repository';

export interface DeleteRuleCommand {
  workspaceId: string;
  id: string;
}

@Injectable()
export class DeleteRuleHandler {
  constructor(
    @Inject(CATEGORIZATION_RULE_REPOSITORY)
    private readonly repo: CategorizationRuleRepository,
  ) {}

  async execute(command: DeleteRuleCommand): Promise<boolean> {
    const existing = await this.repo.findById(command.id);
    if (!existing || existing.workspaceId !== command.workspaceId) {
      return false;
    }
    await this.repo.delete(command.id);
    return true;
  }
}
