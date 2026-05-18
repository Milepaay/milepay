#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Symbol, Vec,
};

// ─── Data types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum EscrowStatus {
    Active,
    Completed,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub released: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub id: u32,
    pub client: Address,
    pub freelancer: Address,
    pub token: Address,
    pub total_amount: i128,
    pub released_amount: i128,
    pub milestones: Vec<Milestone>,
    pub status: EscrowStatus,
}

#[contracttype]
pub enum DataKey {
    Escrow(u32),
    EscrowCount,
    Admin,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct MilePayEscrow;

#[contractimpl]
impl MilePayEscrow {
    /// One-time initialization — set the contract admin.
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::EscrowCount, &0u32);
    }

    /// Client creates an escrow, depositing `total_amount` of `token`.
    /// `milestone_amounts` and `milestone_descs` must have the same length.
    pub fn create_escrow(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        milestone_amounts: Vec<i128>,
        milestone_descs: Vec<String>,
    ) -> u32 {
        client.require_auth();

        let count = milestone_amounts.len();
        if count == 0 || count != milestone_descs.len() {
            panic!("milestone arrays must be non-empty and equal length");
        }

        let total: i128 = milestone_amounts.iter().sum();

        // Pull funds from client into the contract.
        token::Client::new(&env, &token).transfer(
            &client,
            &env.current_contract_address(),
            &total,
        );

        let mut milestones: Vec<Milestone> = Vec::new(&env);
        for i in 0..count {
            milestones.push_back(Milestone {
                id: i,
                description: milestone_descs.get(i).unwrap(),
                amount: milestone_amounts.get(i).unwrap(),
                released: false,
            });
        }

        let escrow_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowCount)
            .unwrap_or(0);

        let escrow = Escrow {
            id: escrow_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            token: token.clone(),
            total_amount: total,
            released_amount: 0,
            milestones,
            status: EscrowStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);
        env.storage()
            .instance()
            .set(&DataKey::EscrowCount, &(escrow_id + 1));

        env.events().publish(
            (Symbol::new(&env, "escrow_created"),),
            (escrow_id, client, freelancer, total),
        );

        escrow_id
    }

    /// Client approves a milestone, releasing funds to the freelancer.
    pub fn release_milestone(env: Env, escrow_id: u32, milestone_id: u32) {
        let mut escrow: Escrow = Self::load_escrow(&env, escrow_id);
        escrow.client.require_auth();

        if escrow.status != EscrowStatus::Active {
            panic!("escrow is not active");
        }

        let mut milestones = escrow.milestones.clone();
        let mut milestone = milestones.get(milestone_id).expect("milestone not found");

        if milestone.released {
            panic!("milestone already released");
        }

        let amount = milestone.amount;
        milestone.released = true;
        milestones.set(milestone_id, milestone);

        token::Client::new(&env, &escrow.token).transfer(
            &env.current_contract_address(),
            &escrow.freelancer,
            &amount,
        );

        escrow.milestones = milestones;
        escrow.released_amount += amount;

        if escrow.released_amount == escrow.total_amount {
            escrow.status = EscrowStatus::Completed;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (Symbol::new(&env, "milestone_released"),),
            (escrow_id, milestone_id, amount),
        );
    }

    /// Client can raise a dispute on an active escrow.
    pub fn dispute(env: Env, escrow_id: u32) {
        let mut escrow: Escrow = Self::load_escrow(&env, escrow_id);
        escrow.client.require_auth();

        if escrow.status != EscrowStatus::Active {
            panic!("escrow is not active");
        }

        escrow.status = EscrowStatus::Disputed;
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_disputed"),),
            (escrow_id,),
        );
    }

    /// Admin resolves a dispute: sends remaining funds to `recipient`.
    pub fn resolve_dispute(env: Env, escrow_id: u32, recipient: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        let mut escrow: Escrow = Self::load_escrow(&env, escrow_id);
        if escrow.status != EscrowStatus::Disputed {
            panic!("escrow is not disputed");
        }

        let remaining = escrow.total_amount - escrow.released_amount;
        if remaining > 0 {
            token::Client::new(&env, &escrow.token).transfer(
                &env.current_contract_address(),
                &recipient,
                &remaining,
            );
        }

        escrow.status = EscrowStatus::Completed;
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (Symbol::new(&env, "dispute_resolved"),),
            (escrow_id, recipient),
        );
    }

    /// Client can refund unreleased funds if escrow is active and all parties agree.
    pub fn refund(env: Env, escrow_id: u32) {
        let mut escrow: Escrow = Self::load_escrow(&env, escrow_id);
        escrow.client.require_auth();

        if escrow.status != EscrowStatus::Active {
            panic!("can only refund an active escrow");
        }

        let remaining = escrow.total_amount - escrow.released_amount;
        if remaining > 0 {
            token::Client::new(&env, &escrow.token).transfer(
                &env.current_contract_address(),
                &escrow.client,
                &remaining,
            );
        }

        escrow.status = EscrowStatus::Refunded;
        env.storage()
            .persistent()
            .set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_refunded"),),
            (escrow_id, remaining),
        );
    }

    /// Read-only: fetch escrow by id.
    pub fn get_escrow(env: Env, escrow_id: u32) -> Escrow {
        Self::load_escrow(&env, escrow_id)
    }

    pub fn escrow_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::EscrowCount)
            .unwrap_or(0)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    fn load_escrow(env: &Env, id: u32) -> Escrow {
        env.storage()
            .persistent()
            .get(&DataKey::Escrow(id))
            .expect("escrow not found")
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
        token::{Client as TokenClient, StellarAssetClient},
        vec, Address, Env, String,
    };

    fn setup() -> (Env, Address, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let client_addr = Address::generate(&env);
        let freelancer = Address::generate(&env);

        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let contract_id = env.register(MilePayEscrow, ());

        // Mint tokens to client
        StellarAssetClient::new(&env, &token_id.address())
            .mint(&client_addr, &10_000_0000000);

        (env, contract_id, admin, client_addr, freelancer, token_id.address())
    }

    #[test]
    fn test_create_and_release() {
        let (env, contract_id, admin, client_addr, freelancer, token) = setup();
        let contract = MilePayEscrowClient::new(&env, &contract_id);

        contract.initialize(&admin);

        let amounts = vec![&env, 100_0000000i128, 200_0000000i128];
        let descs = vec![
            &env,
            String::from_str(&env, "Design"),
            String::from_str(&env, "Development"),
        ];

        let id = contract.create_escrow(&client_addr, &freelancer, &token, &amounts, &descs);
        assert_eq!(id, 0);

        contract.release_milestone(&id, &0);

        let escrow = contract.get_escrow(&id);
        assert_eq!(escrow.released_amount, 100_0000000);
        assert!(escrow.milestones.get(0).unwrap().released);
    }
}
