export type Ok<T> = { success: true; data: T };
export type Fail = { success: false; error: { code: string; message: string } };

export const ok = <T>(data: T): Ok<T> => ({ success: true, data });
export const fail = (code: string, message: string): Fail => ({ 
  success: false, 
  error: { code, message } 
});
