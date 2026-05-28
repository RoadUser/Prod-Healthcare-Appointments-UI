import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { store } from "@/app/store";
import PatientAppointments from "@/views/patient/PatientAppointments";

// Integration-ish test: page renders and shows empty state in mock mode

describe("Reschedule flow", () => {
  it("renders appointments view", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <PatientAppointments />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/My Appointments/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /refresh/i }));
  });
});
