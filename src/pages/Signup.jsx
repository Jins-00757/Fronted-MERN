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

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      email: (value) =>
        !value.includes("@") ? "Invalid email" : null,
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
    },
  });

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(null);

    try {
      await signup(values.name, values.email, values.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size="xs" mt="xl">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text size="xl" fw={700} mb="md">
          Create Account
        </Text>

        <Text size="sm" mb="lg">
          Join Sales Pipeline Intelligence
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Signup Error"
            color="red"
            mb="lg"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Full Name"
              placeholder="Your name"
              {...form.getInputProps("name")}
            />

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
              Create Account
            </Button>
          </Stack>
        </form>

        <Text mt="lg" size="sm">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </Text>
      </Card>
    </Container>
  );
};
