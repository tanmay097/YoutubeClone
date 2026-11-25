import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "light" | "chip";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const bg = variant === "primary" ? colors.primary : variant === "light" ? colors.fg : colors.chip;
  const fg = variant === "light" ? colors.bg : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[s.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        style={[s.input, props.multiline && { height: 110, paddingTop: 12, textAlignVertical: "top" }, error && { borderColor: colors.danger }]}
        {...props}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="alert" style={s.errorBox}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  label: { color: colors.fg, fontSize: 14, fontWeight: "500" },
  input: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.fg,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 13 },
  errorBox: {
    color: colors.danger,
    backgroundColor: "rgba(248,113,113,0.1)",
    padding: 10,
    borderRadius: radius.sm,
    fontSize: 14,
  },
});
