import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';
import { useTheme } from './ThemeContext';

const DropdownComponent = ({ data, value, onChange, editable = true, theme }) => {
  const [isFocus, setIsFocus] = useState(false);
  const { theme: defaultTheme } = useTheme();
  const activeTheme = theme || defaultTheme;

  return (
    <View>
      <Dropdown
        disable={!editable}
        style={[
          styles.dropdown,
          {
            backgroundColor: activeTheme.card,
            borderColor: activeTheme.text,
            color: activeTheme.text,
          },
        ]}
        placeholderStyle={{ color: activeTheme.text }}
        selectedTextStyle={{ color: activeTheme.text }}
        itemTextStyle={{ color: activeTheme.text }}
        containerStyle={{ backgroundColor: activeTheme.card }}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Selecione uma categoria *' : '...'}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          onChange(item?.value?.toString() || '');
          setIsFocus(false);
        }}
      />
    </View>
  );
};

DropdownComponent.propTypes = {
  data: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  editable: PropTypes.bool,
  theme: PropTypes.object,
};

export default DropdownComponent;

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 15,
  },
});
