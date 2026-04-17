#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, BytesN, Env, String, Symbol,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Intent(BytesN<32>),
}

#[derive(Clone)]
#[contracttype]
pub struct IntentExecution {
    pub intent_hash: BytesN<32>,
    pub selected_model: Symbol,
    pub selected_solver: Symbol,
    pub executor: String,
}

#[contract]
pub struct IntentEngine;

#[contractimpl]
impl IntentEngine {
    pub fn log_execution(
        env: Env,
        intent_hash: BytesN<32>,
        selected_model: Symbol,
        selected_solver: Symbol,
        executor: String,
    ) {
        let execution = IntentExecution {
            intent_hash: intent_hash.clone(),
            selected_model,
            selected_solver,
            executor: executor.clone(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Intent(intent_hash.clone()), &execution);

        env.events().publish(
            (symbol_short!("EXECUTED"), intent_hash),
            executor,
        );
    }

    pub fn get_execution(env: Env, intent_hash: BytesN<32>) -> Option<IntentExecution> {
        env.storage()
            .persistent()
            .get(&DataKey::Intent(intent_hash))
    }

    pub fn has_execution(env: Env, intent_hash: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Intent(intent_hash))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Events, BytesN, Env, String, Symbol};

    #[test]
    fn stores_and_reads_execution() {
        let env = Env::default();
        let contract_id = env.register(IntentEngine, ());
        let client = IntentEngineClient::new(&env, &contract_id);

        let hash = BytesN::from_array(&env, &[7u8; 32]);
        let model = Symbol::new(&env, "gpt");
        let solver = Symbol::new(&env, "hybrid");
        let executor = String::from_str(&env, "GBRPYHIL2C6LY4EWOLR2Q5X5ZZOG2O4K4VJXCC6DK6I7MSM4VQX2D2B6");
        client.log_execution(&hash, &model, &solver, &executor);
        let execution = client.get_execution(&hash).unwrap();

        assert_eq!(execution.selected_model, model);
        assert_eq!(execution.selected_solver, solver);
        assert_eq!(execution.executor, executor);
        assert!(client.has_execution(&hash));
    }

    #[test]
    fn emits_execution_event() {
        let env = Env::default();
        let contract_id = env.register(IntentEngine, ());
        let client = IntentEngineClient::new(&env, &contract_id);

        let hash = BytesN::from_array(&env, &[9u8; 32]);
        let model = Symbol::new(&env, "claude");
        let solver = Symbol::new(&env, "risk");
        let executor = String::from_str(&env, "GCFX4J5JH3H4PIGWDH4YXJ7QOPH4BP2J2QQJ4QOZQEHZ4Y5F4S5K5Y3L");
        client.log_execution(&hash, &model, &solver, &executor);

        let events = env.events().all();
        assert_eq!(events.len(), 1);
    }
}
