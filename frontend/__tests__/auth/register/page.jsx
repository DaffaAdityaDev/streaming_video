import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Auth from '../../../src/app/_components/auth';

describe('Auth Component', () => {
  test('renders without crashing', () => {
    const { getByText } = render(
      <Auth
        path="Register"
        message="Please enter your email and password to register"
        formMaker={[]}
        handleBtnSubmit={jest.fn()}
        email=""
        setEmail={jest.fn()}
        password=""
        setPassword={jest.fn()}
        error=""
        setError={jest.fn()}
        gotoAltPath="login"
        haveAccount={true}
      />,
    );

    expect(getByText('Register')).toBeInTheDocument();
    expect(getByText('Please enter your email and password to register')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const handleBtnSubmit = jest.fn();
    const { getByText } = render(
      <Auth
        path="Register"
        message="Please enter your email and password to register"
        formMaker={[]}
        handleBtnSubmit={handleBtnSubmit}
        email=""
        setEmail={jest.fn()}
        password=""
        setPassword={jest.fn()}
        error=""
        setError={jest.fn()}
        gotoAltPath="login"
        haveAccount={true}
      />,
    );

    fireEvent.click(getByText('Register'));
    await waitFor(() => expect(handleBtnSubmit).toHaveBeenCalled());
  });
});
