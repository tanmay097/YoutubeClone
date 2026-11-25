import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { loginSchema, registerSchema } from "@vidora/shared";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { Button, ErrorText, Field } from "./ui";
import { IKIcon } from "./IKIcon";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setFormError(null);
    const parsed = isRegister ? registerSchema.safeParse(form) : loginSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
      return setErrors(fe);
    }
    setErrors({});
    setBusy(true);
    try {
      if (isRegister) await register(form);
      else await login(form);
      router.dismissAll();
    } catch (e) {
      setFormError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginVertical: 16 }}>
          <IKIcon name="logo" size={48} />
          <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "700", marginTop: 12 }}>
            {isRegister ? "Create your account" : "Welcome back"}
          </Text>
        </View>
        {isRegister && (
          <Field label="Channel name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} error={errors.name} autoComplete="name" />
        )}
        <Field
          label="Email"
          value={form.email}
          onChangeText={(email) => setForm({ ...form, email })}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={(password) => setForm({ ...form, password })}
          error={errors.password}
          secureTextEntry
          autoComplete={isRegister ? "new-password" : "current-password"}
          onSubmitEditing={submit}
        />
        {formError && <ErrorText>{formError}</ErrorText>}
        <Button title={isRegister ? "Create account" : "Sign in"} onPress={submit} loading={busy} />
        <Link href={isRegister ? "/login" : "/register"} replace style={{ textAlign: "center", marginTop: 8 }}>
          <Text style={{ color: colors.muted }}>
            {isRegister ? "Already have an account? " : "New to Vidora? "}
            <Text style={{ color: colors.link, fontWeight: "600" }}>{isRegister ? "Sign in" : "Create an account"}</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
