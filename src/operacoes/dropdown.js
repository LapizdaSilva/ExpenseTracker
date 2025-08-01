import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import PropTypes from 'prop-types';

const DropdownComponent = ({ data, value, onChange }) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View>
      <Dropdown
        style={[styles.dropdown]}
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
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    marginBottom: 15,
    color: '#333',
  },
  icon: {
    marginRight: 5,
  },
});
