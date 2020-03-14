import { sessionName } from 'store/reducer';

export const querySessionState = (state) => state[sessionName];
export const querySessionUser = session => session.user;
export const querySessionLoading = session => session.isLoading;
