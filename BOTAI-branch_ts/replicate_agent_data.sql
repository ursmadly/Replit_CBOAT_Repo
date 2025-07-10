-- SQL Script to replicate agent_status and agent_workflows data for each trial

-- Function to replicate agent status records for each trial
CREATE OR REPLACE FUNCTION replicate_agent_statuses_for_trials() RETURNS void AS $$
DECLARE
    trial_record RECORD;
    status_record RECORD;
    existing_count INTEGER;
BEGIN
    -- For each trial
    FOR trial_record IN SELECT id, protocol_id FROM trials LOOP
        RAISE NOTICE 'Processing trial ID: % (Protocol: %)', trial_record.id, trial_record.protocol_id;
        
        -- Check if trial-specific agent statuses already exist
        SELECT COUNT(*) INTO existing_count FROM agent_status WHERE trial_id = trial_record.id;
        
        IF existing_count > 0 THEN
            RAISE NOTICE '  Trial % already has % agent statuses, skipping agent status replication', trial_record.id, existing_count;
        ELSE
            -- Replicate global agent statuses for this trial
            FOR status_record IN 
                SELECT agent_type, status, last_run_time, records_processed, issues_found
                FROM agent_status
                WHERE trial_id IS NULL
            LOOP
                INSERT INTO agent_status (
                    agent_type, status, last_run_time, records_processed, issues_found,
                    trial_id, protocol_id, created_at, updated_at
                ) VALUES (
                    status_record.agent_type,
                    status_record.status,
                    status_record.last_run_time,
                    status_record.records_processed,
                    status_record.issues_found,
                    trial_record.id,
                    trial_record.protocol_id,
                    NOW(),
                    NOW()
                );
            END LOOP;
            
            GET DIAGNOSTICS existing_count = ROW_COUNT;
            RAISE NOTICE '  Created % agent statuses for trial %', existing_count, trial_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to replicate agent workflow records for each trial
CREATE OR REPLACE FUNCTION replicate_agent_workflows_for_trials() RETURNS void AS $$
DECLARE
    trial_record RECORD;
    workflow_record RECORD;
    existing_count INTEGER;
BEGIN
    -- For each trial
    FOR trial_record IN SELECT id, protocol_id FROM trials LOOP
        RAISE NOTICE 'Processing trial ID: % (Protocol: %)', trial_record.id, trial_record.protocol_id;
        
        -- Check if trial-specific agent workflows already exist
        SELECT COUNT(*) INTO existing_count FROM agent_workflows WHERE trial_id = trial_record.id;
        
        IF existing_count > 0 THEN
            RAISE NOTICE '  Trial % already has % agent workflows, skipping agent workflow replication', trial_record.id, existing_count;
        ELSE
            -- Replicate global agent workflows for this trial
            FOR workflow_record IN 
                SELECT name, description, agent_type, ai_component, execution_mode, 
                       prerequisites, triggers, enabled
                FROM agent_workflows
                WHERE trial_id IS NULL
            LOOP
                INSERT INTO agent_workflows (
                    name, description, agent_type, ai_component, execution_mode,
                    prerequisites, triggers, enabled, trial_id, protocol_id,
                    created_at, updated_at
                ) VALUES (
                    workflow_record.name,
                    workflow_record.description,
                    workflow_record.agent_type,
                    workflow_record.ai_component,
                    workflow_record.execution_mode,
                    workflow_record.prerequisites,
                    workflow_record.triggers,
                    workflow_record.enabled,
                    trial_record.id,
                    trial_record.protocol_id,
                    NOW(),
                    NOW()
                );
            END LOOP;
            
            GET DIAGNOSTICS existing_count = ROW_COUNT;
            RAISE NOTICE '  Created % agent workflows for trial %', existing_count, trial_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Main execution
DO $$
BEGIN
    RAISE NOTICE 'Starting agent data replication for trials...';
    
    -- Replicate agent statuses for all trials
    PERFORM replicate_agent_statuses_for_trials();
    
    -- Replicate agent workflows for all trials
    PERFORM replicate_agent_workflows_for_trials();
    
    RAISE NOTICE 'Agent data replication completed successfully';
END;
$$;