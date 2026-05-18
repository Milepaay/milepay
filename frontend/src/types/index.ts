export type EscrowStatus = "Active" | "Completed" | "Disputed" | "Refunded";

export interface Milestone {
  id: number;
  description: string;
  amount: bigint;
  released: boolean;
}

export interface Escrow {
  id: number;
  client: string;
  freelancer: string;
  token: string;
  totalAmount: bigint;
  releasedAmount: bigint;
  milestones: Milestone[];
  status: EscrowStatus;
}

export interface CreateEscrowParams {
  freelancer: string;
  token: string;
  milestones: { description: string; amount: string }[];
}
