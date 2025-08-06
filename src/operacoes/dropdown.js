import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';
import { useTheme } from './ThemeContext';

const DropdownComponent = ({ data, value, onChange }) => {
  const [isFocus, setIsFocus] = useState(false);
  const { theme } = useTheme();

  return (
    <View>
      <Dropdown
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.card,
            borderColor: theme.text,
            color: theme.text,
          }
        ]}
        placeholderStyle={{ color: theme.text }}
        selectedTextStyle={{ color: theme.text }}
        itemTextStyle={{ color: theme.text }}
        containerStyle={{ backgroundColor: theme.card }}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Categoria *' : '...'}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange= {item => {
          onChange(item.value);
          setIsFocus(false);
        }}
      />  
    </View>
  );
};


DropdownComponent.propTypes = {
  data: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default DropdownComponent;

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 15,
  },
  icon: {
    marginRight: 5,
  },
});