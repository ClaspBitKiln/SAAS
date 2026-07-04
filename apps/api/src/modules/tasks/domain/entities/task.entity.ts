import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { TaskStatusEnum, TaskTypeEnum } from '../value-objects/task-enums';
import { makeTaskEvent } from '../events/task.events';

function validTitle(title: string): string {
  const t = title.trim();
  if (t.length < 2 || t.length > 255) throw new Error('Task title must be 2..255 chars');
  return t;
}

export class Task extends AggregateRoot {
  private _organizationId: string;
  private _assigneeUserId: string;
  private _contactId: string | null;
  private _companyId: string | null;
  private _title: string;
  private _type: TaskTypeEnum;
  private _status: TaskStatusEnum;
  private _dueAt: Date;
  private _completedAt: Date | null;

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    assigneeUserId: string;
    contactId?: string | null;
    companyId?: string | null;
    title: string;
    type: TaskTypeEnum;
    status: TaskStatusEnum;
    dueAt: Date;
    completedAt?: Date | null;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({
      id: props.id,
      tenantId: props.tenantId,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this._organizationId = props.organizationId;
    this._assigneeUserId = props.assigneeUserId;
    this._contactId = props.contactId ?? null;
    this._companyId = props.companyId ?? null;
    this._title = props.title;
    this._type = props.type;
    this._status = props.status;
    this._dueAt = props.dueAt;
    this._completedAt = props.completedAt ?? null;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    assigneeUserId: string;
    title: string;
    dueAt: Date;
    type?: TaskTypeEnum;
    contactId?: string | null;
    companyId?: string | null;
  }): Task {
    const task = new Task({
      id: newId(),
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      assigneeUserId: input.assigneeUserId,
      contactId: input.contactId ?? null,
      companyId: input.companyId ?? null,
      title: validTitle(input.title),
      type: input.type ?? TaskTypeEnum.TODO,
      status: TaskStatusEnum.OPEN,
      dueAt: input.dueAt,
    });
    task.addEvent(makeTaskEvent('task.created', task, { title: task._title, dueAt: task._dueAt }));
    return task;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    assigneeUserId: string;
    contactId: string | null;
    companyId: string | null;
    title: string;
    type: TaskTypeEnum;
    status: TaskStatusEnum;
    dueAt: Date;
    completedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return new Task(props);
  }

  updateDetails(input: {
    title?: string;
    dueAt?: Date;
    type?: TaskTypeEnum;
    assigneeUserId?: string;
    contactId?: string | null;
    companyId?: string | null;
  }): void {
    if (this._status !== TaskStatusEnum.OPEN) throw new Error('Task is not open');
    if (input.title !== undefined) this._title = validTitle(input.title);
    if (input.dueAt !== undefined) this._dueAt = input.dueAt;
    if (input.type !== undefined) this._type = input.type;
    if (input.assigneeUserId !== undefined) this._assigneeUserId = input.assigneeUserId;
    if (input.contactId !== undefined) this._contactId = input.contactId;
    if (input.companyId !== undefined) this._companyId = input.companyId;
    this.touch();
    this.addEvent(makeTaskEvent('task.updated', this, { ...input }));
  }

  complete(): void {
    if (this._status !== TaskStatusEnum.OPEN) throw new Error('Task is not open');
    this._status = TaskStatusEnum.DONE;
    this._completedAt = new Date();
    this.touch();
    this.addEvent(makeTaskEvent('task.completed', this, {}));
  }

  cancel(): void {
    if (this._status !== TaskStatusEnum.OPEN) throw new Error('Task is not open');
    this._status = TaskStatusEnum.CANCELLED;
    this.touch();
    this.addEvent(makeTaskEvent('task.cancelled', this, {}));
  }

  get organizationId(): string {
    return this._organizationId;
  }
  get assigneeUserId(): string {
    return this._assigneeUserId;
  }
  get contactId(): string | null {
    return this._contactId;
  }
  get companyId(): string | null {
    return this._companyId;
  }
  get title(): string {
    return this._title;
  }
  get type(): TaskTypeEnum {
    return this._type;
  }
  get status(): TaskStatusEnum {
    return this._status;
  }
  get dueAt(): Date {
    return this._dueAt;
  }
  get completedAt(): Date | null {
    return this._completedAt;
  }
}
