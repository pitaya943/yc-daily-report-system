export type FieldError = {
    field: string;
    message: string;
};
export declare function validatePasswordLength(password: string): FieldError | null;
export declare function validateDisplayName(name: string): FieldError | null;
