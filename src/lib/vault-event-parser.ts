// src/lib/vault-event-parser.ts
import { decodeEventLog, type Address, type Log } from 'viem'

// ABI for the NewFundCreated event from FundDeployer
const NEW_FUND_CREATED_EVENT_ABI = [
    {
        type: 'event',
        name: 'NewFundCreated',
        inputs: [
            { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
            { name: 'vaultProxy', type: 'address', indexed: false, internalType: 'address' },
            { name: 'comptrollerProxy', type: 'address', indexed: false, internalType: 'address' },
            { name: 'fundName', type: 'string', indexed: false, internalType: 'string' }
        ]
    }
] as const

export interface VaultCreationResult {
    creator: Address
    vaultProxy: Address
    comptrollerProxy: Address
    fundName: string
    transactionHash: string
}

export function parseVaultCreationLogs(logs: Log[], txHash: string): VaultCreationResult {
    try {
        // Find the NewFundCreated event in the logs
        for (const log of logs) {
            try {
                const decoded = decodeEventLog({
                    abi: NEW_FUND_CREATED_EVENT_ABI,
                    data: log.data,
                    topics: log.topics,
                })

                if (decoded.eventName === 'NewFundCreated') {
                    return {
                        creator: decoded.args.creator,
                        vaultProxy: decoded.args.vaultProxy,
                        comptrollerProxy: decoded.args.comptrollerProxy,
                        fundName: decoded.args.fundName,
                        transactionHash: txHash,
                    }
                }
            } catch (decodeError) {
                // This log doesn't match our event, continue to next log
                continue
            }
        }

        throw new Error('NewFundCreated event not found in transaction logs')
    } catch (error) {
        console.error('Failed to parse vault creation logs:', error)
        throw new Error(`Failed to parse vault creation result: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Alternative: Manual parsing if you know the event structure
export function parseVaultCreationLogsManual(logs: Log[], txHash: string): VaultCreationResult {
    try {
        // NewFundCreated event signature hash
        const NEW_FUND_CREATED_TOPIC = '0x...' // You need to calculate this from the event signature

        const relevantLog = logs.find(log =>
            log.topics[0] === NEW_FUND_CREATED_TOPIC
        )

        if (!relevantLog) {
            throw new Error('NewFundCreated event not found')
        }

        // Manual parsing - this is more error-prone but doesn't require exact ABI
        // You'll need to adjust based on your actual event structure
        const creator = `0x${relevantLog.topics[1]?.slice(26)}` as Address

        // For non-indexed parameters, you'll need to decode the data field
        // This is complex and error-prone - use the decodeEventLog approach above instead

        throw new Error('Manual parsing not implemented - use decodeEventLog approach')

    } catch (error) {
        console.error('Manual parsing failed:', error)
        throw error
    }
}