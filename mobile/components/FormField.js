import React from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  COLORS,
  FONTS,
  RADIUS,
} from '../constants/theme';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  editable = true,
  maxLength,
  prefix,
  suffix,
}) {
  return (
    <View style={styles.wrapper}>
      {!!label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          !editable && styles.inputShellDisabled,
        ]}
      >
        {!!prefix && (
          <Text style={styles.affix}>
            {prefix}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.brownSoft}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          textAlignVertical={
            multiline
              ? 'top'
              : 'center'
          }
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            !editable && styles.inputDisabled,
          ]}
        />

        {!!suffix && (
          <Text style={styles.affix}>
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.sage,
  },

  inputShell: {
    minHeight: 56,
    paddingHorizontal: 15,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },

  inputShellMultiline: {
    minHeight: 118,
    alignItems: 'flex-start',
  },

  inputShellDisabled: {
    backgroundColor: COLORS.beige,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.forestDark,
  },

  inputMultiline: {
    minHeight: 116,
    paddingTop: 15,
    paddingBottom: 15,
  },

  inputDisabled: {
    color: COLORS.brownSoft,
  },

  affix: {
    marginHorizontal: 7,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.forest,
  },
});