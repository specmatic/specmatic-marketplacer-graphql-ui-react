import { render, screen, fireEvent } from "@testing-library/react";
import { GenericContainer, Wait } from "testcontainers";
import { ApolloProvider } from "@apollo/client/react";
import client from "../apolloClient";
import { CartForm } from "../components/CartForm.js";

const fs = require('fs');
const path = require('path');

global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
/*** @type {import("testcontainers").StartedTestContainer}*/
let graphQLContainer;

beforeAll(async () => {
  graphQLContainer = await new GenericContainer("specmatic/enterprise")
      .withBindMounts([
        {source: path.resolve("specmatic.yaml"), target: "/usr/src/app/specmatic.yaml"},
        {source: path.resolve("test_data"), target: "/usr/src/app/test_data"},
        {source: path.resolve("build/reports/specmatic"), target: "/usr/src/app/build/reports/specmatic"},
      ])
      .withNetworkMode('host')
      .withCommand(["mock"])
      .withLogConsumer(stream => {
        stream.on("data", process.stdout.write.bind(process.stdout));
        stream.on("err", process.stderr.write.bind(process.stderr));
        stream.on("end", () => process.stdout.write("GraphQL mock stopped"));
      })
      .withWaitStrategy(Wait.forLogMessage(/Stub server is running/i))
      .start();
}, 20000);

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
  toastContainer: jest.fn(),
}));

describe("App component tests", () => {
  test('creates a cart and displays cart details', async () => {
    const { firstName, surname, phone } = readCartValues();

    render(
      <ApolloProvider client={client}>
        <CartForm />
      </ApolloProvider>
    );

    // Simulate form submission for creating a cart
    fireEvent.click(screen.getByTestId('createCartButton'));

    // Wait for the cart details to be displayed
    const cartDetails = await screen.findByTestId('cartDetails');

    expect(cartDetails).toBeInTheDocument();
    expect(screen.getByTestId('firstName')).toHaveValue(firstName);
    expect(screen.getByTestId('surname')).toHaveValue(surname);
    expect(screen.getByTestId('phone')).toHaveValue(phone);
  });

  // Test for the fetch cart form
  test('fetches a cart by ID and displays cart details', async () => {
    const { firstName, surname, phone } = readCartValues();

    render(
      <ApolloProvider client={client}>
        <CartForm />
      </ApolloProvider>
    );

    // Simulate form submission for fetching a cart
    fireEvent.click(screen.getByTestId('fetchCartButton'));

    // Wait for the cart details to be displayed
    const fetchedCartDetails = await screen.findByTestId('fetchedCartDetails');

    expect(fetchedCartDetails).toBeInTheDocument();
    expect(screen.getByTestId('firstName')).toHaveValue(firstName);
    expect(screen.getByTestId('surname')).toHaveValue(surname);
    expect(screen.getByTestId('phone')).toHaveValue(phone);
  });

});

afterAll(async () => {
  console.log("Stopping GraphQL Mock server");
  await graphQLContainer?.stop({
    timeout: 60_000,   // give Specmatic time to generate reports
    remove: true
  });
  console.log("GraphQL Mock has stopped");
}, 20000);

function readCartValues() {
  const data = fs.readFileSync(path.resolve(__dirname, '../../test_data/createCart.yaml'), 'utf-8');
  const firstNameMatch = data.match(/firstName: "([^"]+)"/);
  const surnameMatch = data.match(/surname: "([^"]+)"/);
  const phoneMatch = data.match(/phone: "([^"]+)"/);
  return {
    firstName: firstNameMatch ? firstNameMatch[1] : '',
    surname: surnameMatch ? surnameMatch[1] : '',
    phone: phoneMatch ? phoneMatch[1] : ''
  };
}

