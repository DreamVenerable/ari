import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["endDateFieldContainer", "addEndDateButton"]

  connect() {
    console.log("Recurring transactions controller connected!");
  }

  addEndDate() {
    this.endDateFieldContainerTarget.style.display = 'block';
    this.addEndDateButtonTarget.style.display = 'none';
  }
}