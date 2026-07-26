import React, { useState } from 'react';
import { createEligibilityPrivateState, hashPolicyId } from '@midnight-ntwrk/contract';
import { type DAppConnectorAPI } from '@midnight-ntwrk/dapp-connector-api';
import { configureProviders, deployEligibilityContract, joinEligibilityContract, verifyEligibility } from '../api.js';

export const EligibilityForm: React.FC<{
  connectorAPI: DAppConnectorAPI;
  walletAPI: any;
  contractAddress: string;
  setContractAddress: (addr: string) => void;
  onStateUpdate: () => void;
}> = ({ connectorAPI, walletAPI, contractAddress, setContractAddress, onStateUpdate }) => {
  const [age, setAge] = useState<string>('25');
  const [policyId, setPolicyId] = useState<string>('POLICY-12345');
  const [minAge, setMinAge] = useState<string>('18');
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<boolean | null>(null);

  const getPrivateState = () => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 255) throw new Error('Age must be 0-255');
    return createEligibilityPrivateState(ageNum, hashPolicyId(policyId.trim()));
  };

  const handleDeploy = async () => {
    try {
      setLoading('Deploying...');
      setError('');
      setResult(null);
      
      const providers = await configureProviders(connectorAPI, walletAPI);
      const state = getPrivateState();
      const deployed = await deployEligibilityContract(providers, state);
      
      setContractAddress(deployed.deployTxData.public.contractAddress as string);
      onStateUpdate();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  const handleJoin = async () => {
    try {
      setLoading('Joining...');
      setError('');
      setResult(null);
      
      if (!contractAddress) throw new Error('Enter a contract address first');
      
      const providers = await configureProviders(connectorAPI, walletAPI);
      const state = getPrivateState();
      await joinEligibilityContract(providers, contractAddress, state);
      
      onStateUpdate();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading('Generating ZK Proof...');
      setError('');
      setResult(null);
      
      if (!contractAddress) throw new Error('Deploy or join a contract first');
      
      const minAgeNum = parseInt(minAge, 10);
      if (isNaN(minAgeNum) || minAgeNum < 0 || minAgeNum > 255) throw new Error('Min Age must be 0-255');
      
      const providers = await configureProviders(connectorAPI, walletAPI);
      const state = getPrivateState();
      
      const isEligible = await verifyEligibility(providers, contractAddress, minAgeNum, state);
      setResult(isEligible);
      
      onStateUpdate();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="panel">
      <h2>Medical Eligibility Verification</h2>
      
      <div className="form-group mt-4">
        <label>Contract Address</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Deploy a new contract or enter an existing one"
          value={contractAddress} 
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Patient Age (Private)</label>
          <input 
            type="number" 
            className="form-input" 
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Policy ID (Private)</label>
          <input 
            type="text" 
            className="form-input" 
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Required Minimum Age (Public Input)</label>
        <input 
          type="number" 
          className="form-input" 
          value={minAge}
          onChange={(e) => setMinAge(e.target.value)}
        />
      </div>

      <div className="stats-grid mt-4">
        <button 
          className="btn btn-secondary" 
          onClick={handleDeploy} 
          disabled={!!loading}
        >
          Deploy New
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleJoin} 
          disabled={!!loading || !contractAddress}
        >
          Join Existing
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleVerify} 
          disabled={!!loading || !contractAddress}
        >
          Verify Eligibility
        </button>
      </div>

      {loading && (
        <div className="result-box mt-4">
          <span className="text-muted">⏳ {loading}</span>
        </div>
      )}

      {error && (
        <div className="result-box result-error mt-4">
          ❌ {error}
        </div>
      )}

      {result !== null && (
        <div className={`result-box ${result ? 'result-success' : 'result-error'} mt-4`}>
          {result ? '✅ PATIENT IS ELIGIBLE' : '❌ PATIENT IS NOT ELIGIBLE'}
        </div>
      )}
      
      <p className="text-muted mt-4 text-center" style={{ fontSize: '0.875rem' }}>
        🔒 Privacy Guarantee: Your exact age and policy ID are proven in Zero-Knowledge. 
        They never leave your browser and are not visible on the ledger.
      </p>
    </div>
  );
};
