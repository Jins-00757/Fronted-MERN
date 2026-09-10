import {
  Container,
  Card,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Stack,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        !value.includes("@") ? "Invalid email" : null,
      password: (value) =>
        !value ? "Password is required" : null,
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xs" mt="xl">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text size="xl" fw={700} mb="md">
          Sales Pipeline
        </Text>

        <Text size="sm" mb="lg">
          Sign in to your account
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Login Error"
            color="red"
            mb="lg"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              {...form.getInputProps("password")}
            />

            <Button type="submit" loading={isLoading}>
              Sign In
            </Button>
          </Stack>
        </form>

        <Text mt="lg" size="sm">
          Don't have an account?{" "}
          <Link to="/signup">Sign up</Link>
        </Text>
      </Card>
    </Container>
  );
};
