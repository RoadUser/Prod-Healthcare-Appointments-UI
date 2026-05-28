import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/app/store";
import PatientRegister from "@/views/patient/PatientRegister";

// Component test for registration + basic validation

describe("Patient registration", () => {
  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <PatientRegister />
        </MemoryRouter>
      </Provider>
    );

    await user.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByText(/displayName is required/i)).toBeInTheDocument();
  });
});
