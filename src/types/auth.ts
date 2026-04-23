export type JwtPayload = {
	sub: string; // user id
	role: "user" | "instructor" | "admin";
	iat?: number;
	exp?: number;
};
