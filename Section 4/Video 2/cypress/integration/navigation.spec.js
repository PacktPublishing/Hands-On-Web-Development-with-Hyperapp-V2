context('nav bar', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080');
  });

  it('has a nav H logo that navigates to the root', () => {
    cy.get('nav > a.logo').click();
    cy.url().should('eq', 'http://localhost:8080/');
  });

  it('has a nav Hyper News link that navigates to the root', () => {
    cy.get('nav > a').contains('Hyper News').click();
    cy.url().should('eq', 'http://localhost:8080/');
  });
});
