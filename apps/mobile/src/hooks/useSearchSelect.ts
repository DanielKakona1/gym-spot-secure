import { useCallback, useMemo, useState } from 'react';

interface UseSearchSelectParams<T extends { id: string }> {
  options: T[];
  getOptionLabel: (option: T) => string;
  onClear?: () => void;
}

export function useSearchSelect<T extends { id: string }>({
  options,
  getOptionLabel,
  onClear,
}: UseSearchSelectParams<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return options.filter((option) => getOptionLabel(option).toLowerCase().includes(query));
  }, [getOptionLabel, options, searchValue]);

  const onChangeText = useCallback(
    (text: string) => {
      setSearchValue(text);
      setShowResults(true);
      if (text.trim().length === 0) {
        setSelectedId('');
        onClear?.();
      }
    },
    [onClear],
  );

  const onFocus = useCallback(() => {
    setShowResults(true);
  }, []);

  const onSelectOption = useCallback(
    (option: T) => {
      setSelectedId(option.id);
      setSearchValue(getOptionLabel(option));
      setShowResults(false);
    },
    [getOptionLabel],
  );

  return {
    searchValue,
    selectedId,
    showResults,
    filteredOptions,
    setShowResults,
    onChangeText,
    onFocus,
    onSelectOption,
  };
}
