package com.example.letter.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private final boolean ok;
    private final T data;
    private final ErrorBody error;

    private ApiResponse(boolean ok, T data, ErrorBody error) {
        this.ok = ok;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static ApiResponse<?> fail(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorBody(code, message));
    }

    @Getter
    public static class ErrorBody {
        private final String code;
        private final String message;

        ErrorBody(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
