const request = require("supertest");
const app = require("../app");

describe("StudentOS API", () => {
    test("GET / should return API message", async () => {
        const response = await request(app)
            .get("/");

        expect(response.statusCode)
            .toBe(200);

        expect(response.text)
            .toBe(
                "StudentOS API is running"
            );
    });
});
test(
    "Register should fail when name is missing",
    async () => {
        const response =
            await request(app)
                .post("/users/register")
                .send({
                    email:
                        "test@test.com",
                    password:
                        "password123",
                });

        expect(
            response.statusCode
        ).toBe(400);

        expect(
            response.body.message
        ).toBe(
            "Name is required"
        );
    }
);
test(
    "Login should fail when password is missing",
    async () => {
        const response =
            await request(app)
                .post("/users/login")
                .send({
                    email:
                        "test@test.com"
                });

        expect(
            response.statusCode
        ).toBe(400);

        expect(
            response.body.message
        ).toBe(
            "Password is required"
        );
    }
);
test(
    "Protected route should fail without token",
    async () => {
        const response =
            await request(app)
                .get("/tasks");

        expect(
            response.statusCode
        ).toBe(401);

        expect(
            response.body.message
        ).toBe(
            "No token provided"
        );
    }
);