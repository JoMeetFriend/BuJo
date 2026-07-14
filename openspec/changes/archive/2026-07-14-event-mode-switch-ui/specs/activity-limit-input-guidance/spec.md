## ADDED Requirements

### Requirement: Activity limit input explains creator inclusion

The activity creation form SHALL make clear that the activity limit includes the creator.

#### Scenario: Limit label helper appears

- **WHEN** the activity creation form renders the activity limit field
- **THEN** the field label SHALL include helper text `含自己`

### Requirement: Activity limit input enforces minimum of two when limited

The activity creation form SHALL allow an empty activity limit to represent unlimited capacity. When the user provides a limited capacity value, the frontend control SHALL enforce a minimum value of 2.

#### Scenario: Native number control minimum

- **WHEN** the activity limit number control is rendered
- **THEN** the control SHALL expose a minimum value of `2`
- **THEN** the control SHALL step in whole-number increments

#### Scenario: Manual values below two are corrected

- **WHEN** the user enters `1`, `0`, or a negative number in the activity limit field
- **THEN** the form SHALL store the activity limit as `2`

#### Scenario: Empty limit remains unlimited

- **WHEN** the user clears the activity limit field
- **THEN** the form SHALL store no activity limit
