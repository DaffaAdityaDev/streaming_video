import axios, { AxiosError } from "axios";

interface ErrorResponse {
    status: string;
    message: string;
}

export const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        if (axiosError.response) {
            return axiosError.response.data.message || 'An unexpected error occurred';
        }
    }
    return 'An unexpected error occurred';
}
