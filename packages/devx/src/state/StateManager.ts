import { DevxState, StackState } from './types';

/**
 * Manages the state of DevX stacks and services.
 */
export class StateManager {
  private state: DevxState = {
    stacks: {},
  };

  /**
   * Get the current state of all stacks.
   */
  getState(): DevxState {
    return this.state;
  }

  /**
   * Get the state of a specific stack.
   */
  getStackState(stackName: string): StackState | undefined {
    return this.state.stacks[stackName];
  }

  /**
   * Update the state of a specific stack.
   */
  updateStackState(stackName: string, state: StackState): void {
    this.state.stacks[stackName] = state;
  }

  /**
   * Remove a stack from the state.
   */
  removeStack(stackName: string): void {
    delete this.state.stacks[stackName];
  }
} 